import { FILE_ICON_SVG, DL_ICON_SVG, LINK_ICON_SVG, EDIT_ICON_SVG } from "../../utils/admin-icons";

const TRASH_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1.2rem;height:1.2rem;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>';

// ── Types ──────────────────────────────────────────────────────────────
      interface FileItem { key: string; originalName: string; size: string; sizeBytes: number; uploaded: string; }
      interface FilesResponse { files: FileItem[]; }
      interface UploadResponse { ok?: boolean; error?: string; }

      // ── State & DOM ────────────────────────────────────────────────────────
      const TOKEN_KEY = "admin_access_token";
      let currentToken: string | null = null;
      let editingKey: string = "";  // clave del archivo que se está editando

      const loginView      = document.getElementById("loginView")!;
      const dashboardView  = document.getElementById("dashboardView")!;
      const initSpinner    = document.getElementById("initSpinner")!;
      const loginTokenEl   = document.getElementById("loginToken") as HTMLInputElement;
      const loginBtn       = document.getElementById("loginBtn") as HTMLButtonElement;
      const loginError     = document.getElementById("loginError")!;
      const logoutBtn      = document.getElementById("logoutBtn") as HTMLButtonElement;
      const refreshBtn     = document.getElementById("refreshBtn") as HTMLButtonElement;
      // ── DOM refs ──────────────────────────────────────────────────────
      const openUploadModalBtn = document.getElementById("openUploadModalBtn") as HTMLButtonElement;

      // ── Modal DOM refs ──────────────────────────────────────────────────────
      const modalFile         = document.getElementById("modalFile")!;
      const modalFileBackdrop = document.getElementById("modalFileBackdrop")!;
      const modalFileClose    = document.getElementById("modalFileClose") as HTMLButtonElement;
      const modalFileTitle    = document.getElementById("modalFileTitle")!;
      const modalFileCurrentInfo = document.getElementById("modalFileCurrentInfo")!;
      const modalFileCurrentName = document.getElementById("modalFileCurrentName")!;
      const modalFileDropLabel   = document.getElementById("modalFileDropLabel")!;
      const modalFileDropZone    = document.getElementById("modalFileDropZone")!;
      const modalFileInput       = document.getElementById("modalFileInput") as HTMLInputElement;
      const modalFileName        = document.getElementById("modalFileName")!;
      const modalKeyInput        = document.getElementById("modalKeyInput") as HTMLInputElement;
      const modalKeyOptional     = document.getElementById("modalKeyOptional")!;
      const modalKeyExt          = document.getElementById("modalKeyExt")!;
      const modalProgressWrap    = document.getElementById("modalProgressWrap")!;
      const modalProgressBar     = document.getElementById("modalProgressBar")!;
      const modalFileStatus      = document.getElementById("modalFileStatus")!;
      const modalFileCancelBtn   = document.getElementById("modalFileCancelBtn") as HTMLButtonElement;
      const modalFileSaveBtn     = document.getElementById("modalFileSaveBtn") as HTMLButtonElement;

      let currentMode: "upload" | "edit" = "upload";

      // ── Helpers ────────────────────────────────────────────────────────────
      function escHtml(s: string) {
        return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      }
      function showLogin() {
        initSpinner.style.display = "none";
        loginView.style.display = "flex";
        dashboardView.style.display = "none";
      }
      function showDashboard() {
        initSpinner.style.display = "none";
        loginView.style.display = "none";
        dashboardView.style.display = "flex";
      }
      function showLoginError(msg: string) {
        loginError.textContent = msg;
        loginError.classList.remove("hidden");
      }
      function clearLoginError() {
        loginError.textContent = "";
        loginError.classList.add("hidden");
      }
      let toastTimeout: any;
      function showToast(msg: string, type: "success" | "error" = "success") {
        const toastNotif = document.getElementById("toastNotification")!;
        const toastIcon = document.getElementById("toastIcon")!;
        const toastMessage = document.getElementById("toastMessage")!;
        
        // Limpiar estilos en línea residuales de la animación de ocultado
        toastNotif.style.opacity = "";
        toastNotif.style.transform = "";
        
        if (type === "success") {
          toastNotif.className = "fixed bottom-6 right-6 transform transition-all duration-300 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl font-medium shadow-xl bg-green-50 text-green-700 border border-green-200 translate-y-0 opacity-100";
          toastIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1.2rem;height:1.2rem;"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`;
        } else {
          toastNotif.className = "fixed bottom-6 right-6 transform transition-all duration-300 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl font-medium shadow-xl bg-red-50 text-red-600 border border-red-200 translate-y-0 opacity-100";
          toastIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1.2rem;height:1.2rem;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
        }
        toastMessage.textContent = msg;
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toastNotif.style.opacity = "0";
          toastNotif.style.transform = "translateY(1rem)";
          setTimeout(() => { toastNotif.className = "hidden"; }, 300);
        }, 3000);
      }
      function setModalStatus(type: "success" | "error" | "none", msg = "") {
        modalFileStatus.className = "hidden p-3 font-medium rounded-xl border text-center";
        modalFileStatus.style.fontSize = "14px";
        if (type === "none") return;
        modalFileStatus.textContent = msg;
        modalFileStatus.classList.remove("hidden");
        if (type === "success") modalFileStatus.classList.add("bg-green-50","text-green-700","border-green-200");
        else modalFileStatus.classList.add("bg-red-50","text-red-600","border-red-200");
      }

      // ── Render Files ───────────────────────────────────────────────────────
      
      
      
      

      function renderFiles(files: FileItem[]) {
        filesCount.textContent = `${files.length} archivo${files.length !== 1 ? "s" : ""}`;
        if (!files.length) {
          filesTableBody.innerHTML = `
            <tr><td colspan="4" style="padding: 4rem 1.25rem; text-align:center;">
              <div style="width:3rem;height:3rem;margin:0 auto 0.75rem;background:#f3f4f6;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;">${FILE_ICON_SVG}</div>
              <p style="color:#6b7280;font-weight:500;font-size:15px;">Sin archivos en R2</p>
              <p style="color:#9ca3af;font-size:13px;margin-top:0.25rem;">Sube tu primer archivo desde el panel izquierdo</p>
            </td></tr>`;
          return;
        }
        filesTableBody.innerHTML = files.map(f => {
          const date = new Date(f.uploaded).toLocaleString("es-ES",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
          return `
            <tr style="transition:background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
              <td style="padding: 0.85rem 1.25rem;">
                <div style="display:flex;align-items:center;gap:0.6rem;">
                  <div class="hidden sm:flex" style="width:2.25rem;height:2.25rem;border-radius:0.5rem;background:#f3f4f6;align-items:center;justify-content:center;flex-shrink:0;">${FILE_ICON_SVG}</div>
                  <div style="display:flex;flex-direction:column;justify-content:center;min-width:0;">
                    <span style="font-weight:500;color:#1f2937;font-size:14px;word-break:break-word;line-height:1.2;">${escHtml(f.originalName)}</span>
                    <a href="https://archivos.ieslinstitute.com/${encodeURIComponent(f.key)}" target="_blank" rel="noopener noreferrer" style="color:#9ca3af;font-size:12px;margin-top:0.25rem;text-decoration:none;word-break:break-all;transition:color 0.15s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='#9ca3af'">archivos.ieslinstitute.com/${escHtml(f.key)}</a>
                  </div>
                </div>
              </td>
              <td style="padding:0.85rem 1.25rem;color:#9ca3af;font-size:13px;white-space:nowrap;">${escHtml(f.size)}</td>
              <td style="padding:0.85rem 1.25rem;color:#9ca3af;font-size:13px;white-space:nowrap;">${date}</td>
              <td style="padding:0.85rem 1.25rem;">
                <div class="actions-dropdown">
                  <button class="actions-toggle" type="button" title="Acciones"
                    style="display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:0.5rem;border:1px solid #e5e7eb;background:white;cursor:pointer;transition:all 0.15s;color:#6b7280;"
                    onmouseover="this.style.background='#f3f4f6'"
                    onmouseout="this.style.background='white'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.1rem;height:1.1rem;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  </button>
                  <div class="actions-dropdown-menu">
                    <button class="edit-btn" data-key="${escHtml(f.key)}" data-name="${escHtml(f.originalName)}" type="button"
                      style="display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0.85rem;border:none;background:none;font-size:13px;font-weight:500;color:#374151;cursor:pointer;transition:background 0.12s;text-align:left;"
                      onmouseover="this.style.background='#f3f4f6'"
                      onmouseout="this.style.background='none'"
                    >
                      ${EDIT_ICON_SVG} Editar
                    </button>
                    <button class="copy-link-btn" data-key="${escHtml(f.key)}" type="button"
                      style="display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0.85rem;border:none;background:none;font-size:13px;font-weight:500;color:#374151;cursor:pointer;transition:background 0.12s;text-align:left;"
                      onmouseover="this.style.background='#f3f4f6'"
                      onmouseout="this.style.background='none'"
                    >
                      ${LINK_ICON_SVG} Copiar enlace
                    </button>
                    <button class="download-btn" data-key="${escHtml(f.key)}" data-name="${escHtml(f.originalName)}" type="button"
                      style="display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0.85rem;border:none;background:none;font-size:13px;font-weight:500;color:#374151;cursor:pointer;transition:background 0.12s;text-align:left;"
                      onmouseover="this.style.background='#f3f4f6'"
                      onmouseout="this.style.background='none'"
                    >
                      ${DL_ICON_SVG} Descargar
                    </button>
                    <button class="delete-btn" data-key="${escHtml(f.key)}" type="button"
                      style="display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0.85rem;border:none;background:none;font-size:13px;font-weight:500;color:#ef4444;cursor:pointer;transition:background 0.12s;text-align:left;"
                      onmouseover="this.style.background='#fef2f2'"
                      onmouseout="this.style.background='none'"
                    >
                      ${TRASH_ICON_SVG} Eliminar
                    </button>
                  </div>
                </div>
              </td>
            </tr>`;
        }).join("");
      }

      // ── Load Files ─────────────────────────────────────────────────────────
      async function loadFiles(): Promise<boolean> {
        if (!currentToken) return false;
        filesTableBody.innerHTML = `<tr><td colspan="4" style="padding:3.5rem 1.25rem;text-align:center;color:#9ca3af;"><span class="spinner"></span>Cargando archivos...</td></tr>`;
        try {
          const res = await fetch("/api/files", { headers: { "Authorization": `Bearer ${currentToken}` } });
          if (res.status === 403) return false;
          const data = await res.json() as FilesResponse;
          renderFiles(data.files);
          return true;
        } catch {
          filesTableBody.innerHTML = `<tr><td colspan="4" style="padding:3.5rem 1.25rem;text-align:center;color:#ef4444;font-weight:500;">Error de red. Inténtalo de nuevo.</td></tr>`;
          return true;
        }
      }

      // ── Download ────────────────────────────────────────────────────────────
      async function downloadFile(key: string, name: string) {
        if (!currentToken) return;
        const btn = filesTableBody.querySelector<HTMLButtonElement>(`[data-key="${CSS.escape(key)}"]`);
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `<svg style="animation: spin 1s linear infinite; width: 1.1rem; height: 1.1rem; margin-right: 0.3rem;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Procesando...`;
          btn.style.opacity = "0.7";
        }
        try {
          const res = await fetch(`/api/files?download=${encodeURIComponent(key)}`, { headers: { "Authorization": `Bearer ${currentToken}` } });
          if (!res.ok) { alert(`Error al descargar (${res.status})`); return; }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = blobUrl; a.download = name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `${DL_ICON_SVG} Descargar`;
            btn.style.opacity = "1";
          }
        }
      }

      // ── Modal Unified Logic ───────────────────────────────────────────────
      
      function openModal(mode: "upload" | "edit", key?: string, name?: string) {
        currentMode = mode;
        setModalStatus("none");
        modalFileInput.value = "";
        modalFileName.classList.add("hidden");
        modalKeyExt.classList.add("hidden");
        modalKeyInput.value = "";
        modalFileSaveBtn.disabled = false;
        
        if (mode === "upload") {
          editingKey = "";
          modalFileTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" style="color: var(--color-primary);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg> Subir archivo`;
          modalFileCurrentInfo.classList.add("hidden");
          modalFileDropLabel.innerHTML = `Archivo`;
          modalKeyOptional.classList.remove("hidden");
          modalFileSaveBtn.disabled = true; // wait for file
          modalFileSaveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" /></svg> Subir archivo`;
        } else {
          editingKey = key || "";
          modalFileTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" style="color: var(--color-primary);"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg> Editar archivo`;
          modalFileCurrentInfo.classList.remove("hidden");
          modalFileCurrentName.textContent = name || "";
          modalFileDropLabel.innerHTML = `Reemplazar archivo <span class="font-normal text-gray-400">(opcional)</span>`;
          modalKeyOptional.classList.add("hidden");
          modalFileSaveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg> Guardar`;
          
          const lastDotIdx = editingKey.lastIndexOf(".");
          let baseKey = editingKey;
          let ext = "";
          if (lastDotIdx > 0) {
            baseKey = editingKey.substring(0, lastDotIdx);
            ext = editingKey.substring(lastDotIdx).toLowerCase();
          }
          modalKeyInput.value = baseKey;
          if (ext) {
            modalKeyExt.textContent = ext;
            modalKeyExt.classList.remove("hidden");
          }
        }
        modalFile.style.display = "flex";
      }

      function closeModal() {
        modalFile.style.display = "none";
        editingKey = "";
        modalFileInput.value = "";
        modalFileName.classList.add("hidden");
        setModalStatus("none");
      }

      async function submitForm() {
        if (!currentToken) return;
        const file = modalFileInput.files?.[0];
        
        let targetKey = modalKeyInput.value.trim().replace(/[\/\\]/g, "");
        const ext = modalKeyExt.textContent;

        if (currentMode === "upload") {
          if (!file) return;
          const fd = new FormData();
          fd.append("file", file);
          if (targetKey) {
            if (ext && !targetKey.toLowerCase().endsWith(ext)) targetKey += ext;
            fd.append("customKey", targetKey);
          }
          modalFileSaveBtn.disabled = true;
          modalProgressWrap.classList.remove("hidden");
          modalProgressBar.style.width = "0%";
          setModalStatus("none");
          let pct = 0;
          const timer = setInterval(() => { pct = Math.min(pct + 8, 85); modalProgressBar.style.width = `${pct}%`; }, 150);
          try {
            const res = await fetch("/api/upload", { method: "POST", headers: { "Authorization": `Bearer ${currentToken}` }, body: fd });
            clearInterval(timer); modalProgressBar.style.width = "100%";
            if (res.ok) {
              setModalStatus("success", `"${file.name}" subido correctamente`);
              await loadFiles();
              setTimeout(closeModal, 1200);
            } else {
              const body = await res.json() as UploadResponse;
              setModalStatus("error", `Error: ${body.error ?? res.status}`);
              modalFileSaveBtn.disabled = false;
            }
          } catch {
            clearInterval(timer);
            setModalStatus("error", "Error de red. Inténtalo de nuevo.");
            modalFileSaveBtn.disabled = false;
          } finally {
            setTimeout(() => { modalProgressWrap.classList.add("hidden"); modalProgressBar.style.width = "0%"; }, 1600);
          }
        } else {
          // Edit Mode
          if (!targetKey) {
            setModalStatus("error", "El enlace no puede estar vacío.");
            return;
          }
          if (ext && !targetKey.toLowerCase().endsWith(ext)) {
            targetKey += ext;
          }
          if (!file && targetKey === editingKey) {
            setModalStatus("error", "No hay cambios que guardar.");
            return;
          }

          modalFileSaveBtn.disabled = true;
          setModalStatus("none");

          const fd = new FormData();
          fd.append("oldKey", editingKey);
          fd.append("newKey", targetKey);
          if (file) fd.append("file", file);

          try {
            const res = await fetch("/api/files-manage", {
              method: "PUT",
              headers: { "Authorization": `Bearer ${currentToken}` },
              body: fd,
            });
            if (res.ok) {
              setModalStatus("success", "Archivo actualizado correctamente.");
              await loadFiles();
              setTimeout(closeModal, 1200);
            } else {
              const body = await res.json() as UploadResponse;
              setModalStatus("error", `Error: ${body.error ?? res.status}`);
              modalFileSaveBtn.disabled = false;
            }
          } catch {
            setModalStatus("error", "Error de red. Inténtalo de nuevo.");
            modalFileSaveBtn.disabled = false;
          }
        }
      }

      async function deleteFile(key: string) {
        if (!currentToken) return;
        if (!confirm(`¿Eliminar "${key}"?\nEsta acción no se puede deshacer.`)) return;

        try {
          const res = await fetch("/api/files-manage", {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${currentToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key }),
          });
          if (res.ok) {
            showToast("Archivo eliminado", "success");
            await loadFiles();
          } else {
            const body = await res.json() as UploadResponse;
            showToast(`Error: ${body.error ?? res.status}`, "error");
          }
        } catch {
          showToast("Error de red al eliminar", "error");
        }
      }

      // ── Login ──────────────────────────────────────────────────────────────
      async function doLogin() {
        clearLoginError();
        const token = loginTokenEl.value.trim();
        if (!token) { showLoginError("Ingresa tu clave de acceso."); return; }
        loginBtn.disabled = true;
        try {
          const res = await fetch("/api/files", { headers: { "Authorization": `Bearer ${token}` } });
          if (res.status === 403) { showLoginError("Clave incorrecta. Inténtalo de nuevo."); return; }
          currentToken = token; localStorage.setItem(TOKEN_KEY, token);
          const data = await res.json() as FilesResponse;
          showDashboard(); renderFiles(data.files); loginTokenEl.value = "";
        } catch { showLoginError("Error de red. Verifica tu conexión."); }
        finally { loginBtn.disabled = false; }
      }

      function doLogout() {
        currentToken = null; localStorage.removeItem(TOKEN_KEY);
        filesTableBody.innerHTML = ""; filesCount.textContent = "—";
        setModalStatus("none"); showLogin();
      }

      // ── Init — decide qué vista mostrar sin ningún flash ──────────────────
      async function init() {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          currentToken = stored;
          const valid = await loadFiles();
          if (valid) { showDashboard(); }
          else { currentToken = null; localStorage.removeItem(TOKEN_KEY); showLogin(); }
        } else {
          showLogin();
        }
      }

      // ── Events ─────────────────────────────────────────────────────────────
      loginBtn.addEventListener("click", () => void doLogin());
      loginTokenEl.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter") void doLogin(); });
      logoutBtn?.addEventListener("click", doLogout);
      refreshBtn?.addEventListener("click", () => void loadFiles());
      
      const refreshBtnMobile = document.getElementById("refreshBtnMobile");
      const logoutBtnMobile = document.getElementById("logoutBtnMobile");
      refreshBtnMobile?.addEventListener("click", () => void loadFiles());
      logoutBtnMobile?.addEventListener("click", doLogout);

      async function copyToClipboard(text: string, btn: HTMLButtonElement) {
        try {
          await navigator.clipboard.writeText(text);
          showToast("¡Enlace copiado al portapapeles!", "success");
        } catch (err) {
          showToast("Error al copiar enlace", "error");
        }
      }

      function closeAllDropdowns() {
        document.querySelectorAll(".actions-dropdown-menu.open").forEach(m => m.classList.remove("open"));
      }
      
      document.addEventListener("click", (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(".actions-dropdown")) closeAllDropdowns();
      });

      filesTableBody.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        const toggleBtn = target.closest<HTMLButtonElement>(".actions-toggle");
        if (toggleBtn) {
          e.stopPropagation();
          const menu = toggleBtn.nextElementSibling as HTMLElement;
          const wasOpen = menu.classList.contains("open");
          closeAllDropdowns();
          if (!wasOpen) menu.classList.add("open");
          return;
        }

        const dlBtn = target.closest<HTMLButtonElement>(".download-btn");
        if (dlBtn) { closeAllDropdowns(); void downloadFile(dlBtn.dataset["key"] ?? "", dlBtn.dataset["name"] ?? ""); return; }

        const copyBtn = target.closest<HTMLButtonElement>(".copy-link-btn");
        if (copyBtn) {
          closeAllDropdowns();
          const key = copyBtn.dataset["key"] ?? "";
          const PUBLIC_R2_DOMAIN = "https://archivos.ieslinstitute.com";
          const url = `${PUBLIC_R2_DOMAIN}/${encodeURIComponent(key)}`;
          void copyToClipboard(url, copyBtn);
          return;
        }

        const editBtn = target.closest<HTMLButtonElement>(".edit-btn");
        if (editBtn) { closeAllDropdowns(); openModal("edit", editBtn.dataset["key"] ?? "", editBtn.dataset["name"] ?? ""); return; }

        const deleteBtn = target.closest<HTMLButtonElement>(".delete-btn");
        if (deleteBtn) { closeAllDropdowns(); void deleteFile(deleteBtn.dataset["key"] ?? ""); return; }
      });

      openUploadModalBtn.addEventListener("click", () => openModal("upload"));

      // ── Edit Modal Events ──────────────────────────────────────────────────
      modalFileClose.addEventListener("click", closeModal);
      modalFileBackdrop.addEventListener("click", closeModal);
      modalFileCancelBtn.addEventListener("click", closeModal);
      modalFileSaveBtn.addEventListener("click", () => void submitForm());

      modalFileInput.addEventListener("change", () => {
        const file = modalFileInput.files?.[0];
        if (file) {
          modalFileName.textContent = file.name;
          modalFileName.classList.remove("hidden");
          if (currentMode === "upload") modalFileSaveBtn.disabled = false;
          
          const lastDot = file.name.lastIndexOf(".");
          let base = file.name;
          let ext = "";
          if (lastDot > 0) {
             base = file.name.substring(0, lastDot);
             ext = file.name.substring(lastDot).toLowerCase();
          }
          
          if (currentMode === "upload" && !modalKeyInput.value.trim()) {
            modalKeyInput.value = base.replace(/[\s_]+/g, "-").replace(/[^\w-]/g, "").toLowerCase();
          }

          if (ext) {
            modalKeyExt.textContent = ext;
            modalKeyExt.classList.remove("hidden");
          } else {
            modalKeyExt.textContent = "";
            modalKeyExt.classList.add("hidden");
          }
        } else {
          modalFileName.classList.add("hidden");
          if (currentMode === "upload") modalFileSaveBtn.disabled = true;

          const lastDotIdx = editingKey.lastIndexOf(".");
          const ext = lastDotIdx > 0 ? editingKey.substring(lastDotIdx).toLowerCase() : "";
          if (ext && currentMode === "edit") {
            modalKeyExt.textContent = ext;
            modalKeyExt.classList.remove("hidden");
          } else {
            modalKeyExt.textContent = "";
            modalKeyExt.classList.add("hidden");
          }
        }
      });

      modalFileDropZone.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        modalFileDropZone.style.borderColor = "var(--color-primary)";
        modalFileDropZone.style.background = "color-mix(in srgb, var(--color-primary) 5%, white)";
      });
      modalFileDropZone.addEventListener("dragleave", () => {
        modalFileDropZone.style.borderColor = "";
        modalFileDropZone.style.background = "";
      });
      modalFileDropZone.addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        modalFileDropZone.style.borderColor = "";
        modalFileDropZone.style.background = "";
        const dropped = e.dataTransfer?.files;
        if (dropped?.length) {
          const dt = new DataTransfer();
          dt.items.add(dropped[0]);
          modalFileInput.files = dt.files;
          modalFileInput.dispatchEvent(new Event("change"));
        }
      });

      // Cerrar modal con Escape
      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape" && modalFile.style.display !== "none") closeModal();
      });

      void init();