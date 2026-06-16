import { App, Modal, Notice, Setting, TFile, activeDocument } from "obsidian";
import type AttachmentImagebedManagerPlugin from "./plugin";
import { Candidate, ProgressState, LocalFileRecord } from "./types";
import { formatBytes, isPreviewableImage } from "./utils";

export class CandidateModal extends Modal {
  plugin: AttachmentImagebedManagerPlugin;
  noteFile: TFile;
  candidates: Candidate[];
  selected: Set<string>;
  progressBar: HTMLProgressElement | null = null;
  progressText: HTMLElement | null = null;

  constructor(app: App, plugin: AttachmentImagebedManagerPlugin, noteFile: TFile, candidates: Candidate[]) {
    super(app);
    this.plugin = plugin;
    this.noteFile = noteFile;
    this.candidates = candidates;
    this.selected = new Set(candidates.map((c) => c.file.path));
  }

  onOpen(): void {
    this.modalEl.addClass("attachment-imagebed-manager-modal");
    this.renderContent();
  }

  private renderContent(): void {
    const { contentEl } = this;
    contentEl.empty();
    const t = this.plugin.t.bind(this.plugin);

    new Setting(contentEl).setName(t("replaceTitle")).setHeading();
    contentEl.createEl("p", {
      text: t("candidateSummary", { path: this.noteFile.path, count: this.candidates.length }),
      cls: "attachment-imagebed-manager-summary",
    });

    // Directly render the gallery view into content element
    this.renderGalleryView(contentEl, this.candidates);

    // Bottom bar: select all + actions
    const bottomBar = contentEl.createDiv({ cls: "attachment-imagebed-manager-bottom-bar" });
    const selectAllLabel = bottomBar.createEl("label", { cls: "attachment-imagebed-manager-select-all" });
    const selectAllCb = selectAllLabel.createEl("input", { type: "checkbox" });
    
    selectAllCb.checked = this.candidates.length > 0 && this.candidates.every((c) => this.selected.has(c.file.path));
    selectAllCb.addEventListener("change", () => {
      if (selectAllCb.checked) {
        for (const c of this.candidates) this.selected.add(c.file.path);
      } else {
        this.selected.clear();
      }
      this.renderContent();
    });
    selectAllLabel.createSpan({ text: t("selectAll") });

    const actions = bottomBar.createDiv({ cls: "attachment-imagebed-manager-actions" });
    new Setting(actions)
      .addButton((button) =>
        button.setButtonText(t("cancel")).onClick(() => this.close())
      )
      .addButton((button) =>
        button.setButtonText(t("uploadReplace")).setCta().onClick(() => this.replaceSelected())
      );
  }

  private renderGalleryView(containerEl: HTMLElement, candidates: Candidate[]): void {
    const gallery = containerEl.createDiv({ cls: "attachment-imagebed-manager-gallery" });
    for (const candidate of candidates) {
      const card = gallery.createDiv({ cls: "attachment-imagebed-manager-gallery-card" });

      // Click card to toggle selection
      card.addEventListener("click", (e) => {
        // Prevent trigger twice when clicking directly on checkbox
        if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
          return;
        }
        const path = candidate.file.path;
        if (this.selected.has(path)) {
          this.selected.delete(path);
        } else {
          this.selected.add(path);
        }
        this.renderContent();
      });

      const previewArea = card.createDiv({ cls: "attachment-imagebed-manager-gallery-preview" });
      if (isPreviewableImage(candidate.file.extension)) {
        const image = previewArea.createEl("img");
        image.src = this.app.vault.getResourcePath(candidate.file);
        image.alt = candidate.file.name;
        image.loading = "lazy";
      } else {
        const badge = previewArea.createDiv({ cls: "attachment-imagebed-manager-gallery-badge" });
        badge.textContent = candidate.file.extension.toUpperCase();
      }

      const info = card.createDiv({ cls: "attachment-imagebed-manager-gallery-info" });
      const checkbox = info.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selected.has(candidate.file.path);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selected.add(candidate.file.path);
        else this.selected.delete(candidate.file.path);
        this.renderContent();
      });
      info.createDiv({ text: candidate.file.name, cls: "attachment-imagebed-manager-gallery-name" });
      info.createDiv({
        text: formatBytes(candidate.sizeBytes),
        cls: "attachment-imagebed-manager-gallery-size",
      });
    }
  }

  async replaceSelected(): Promise<void> {
    const t = this.plugin.t.bind(this.plugin);
    const chosen = this.candidates.filter((c) => this.selected.has(c.file.path));
    if (!chosen.length) {
      new Notice(t("noSelected"));
      return;
    }
    this.renderProgress(chosen.length);
    try {
      const result = await this.plugin.replaceCandidates(this.noteFile, chosen, (state) => {
        this.updateProgress(state);
      });
      new Notice(t("replacedNotice", { count: result.replaced }));
      this.renderDeleteConfirmation(result.localFiles || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Attachment replacement failed", error);
      new Notice(t("replaceFailed", { error: message }), 10000);
      this.renderError(error instanceof Error ? error : new Error(message));
    }
  }

  renderProgress(total: number): void {
    const t = this.plugin.t.bind(this.plugin);
    const { contentEl } = this;
    contentEl.empty();
    new Setting(contentEl).setName(t("uploadingTitle")).setHeading();
    contentEl.createEl("p", {
      text: t("preparing", { count: total }),
      cls: "attachment-imagebed-manager-summary",
    });
    this.progressBar = contentEl.createEl("progress", {
      cls: "attachment-imagebed-manager-progress",
    });
    this.progressBar.max = 100;
    this.progressBar.value = 0;
    this.progressText = contentEl.createDiv({
      text: t("starting"),
      cls: "attachment-imagebed-manager-meta",
    });
  }

  updateProgress(state: ProgressState): void {
    if (!this.progressBar || !this.progressText) return;
    const t = this.plugin.t.bind(this.plugin);
    const total = Math.max(1, state.total || 1);
    const value = Math.min(100, Math.round(((state.current || 0) / total) * 100));
    this.progressBar.value = value;
    const phaseMap: Record<string, string> = {
      uploading: t("phaseUploading"),
      uploaded: t("phaseUploaded"),
      rewriting: t("phaseRewriting"),
      trashing: t("phaseTrashing"),
      scheduling: t("phaseScheduling"),
      done: t("phaseDone"),
    };
    const phaseText = phaseMap[state.phase] || state.phase;
    this.progressText.setText(`${phaseText}: ${state.label || ""} (${state.current || 0}/${total})`);
  }

  renderDeleteConfirmation(localFiles: LocalFileRecord[]): void {
    const t = this.plugin.t.bind(this.plugin);
    const { contentEl } = this;
    contentEl.empty();
    new Setting(contentEl).setName(t("linksReplacedTitle")).setHeading();
    contentEl.createEl("p", {
      text: t("linksReplacedDesc"),
      cls: "attachment-imagebed-manager-summary",
    });
    if (localFiles.length) {
      const list = contentEl.createDiv({ cls: "attachment-imagebed-manager-delete-list" });
      for (const fileRecord of localFiles) {
        list.createDiv({
          text: `${fileRecord.name} \u00b7 ${fileRecord.path}`,
          cls: "attachment-imagebed-manager-meta",
        });
      }
    }
    const actions = contentEl.createDiv({ cls: "attachment-imagebed-manager-actions" });
    new Setting(actions)
      .addButton((button) =>
        button.setButtonText(t("keepLocal")).onClick(() => this.close())
      )
      .addButton((button) =>
        button
          .setButtonText(t("deleteLocal"))
          .setWarning()
          .onClick(async () => {
            try {
              await this.plugin.deleteLocalFileRecords(this.noteFile, localFiles, "manual-delete");
              new Notice(t("movedToTrash", { count: localFiles.length }));
              this.close();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : String(error);
              console.error("Attachment local delete failed", error);
              new Notice(t("localDeleteFailed", { error: message }), 10000);
              this.renderError(error instanceof Error ? error : new Error(message));
            }
          })
      );
  }

  renderError(error: Error): void {
    const t = this.plugin.t.bind(this.plugin);
    const { contentEl } = this;
    contentEl.createEl("p", {
      text: error.message || String(error),
      cls: "attachment-imagebed-manager-summary",
    });
    const actions = contentEl.createDiv({ cls: "attachment-imagebed-manager-actions" });
    new Setting(actions).addButton((button) =>
      button.setButtonText(t("close")).onClick(() => this.close())
    );
  }
}
