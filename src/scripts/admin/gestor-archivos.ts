import { FILE_ICON_SVG, DL_ICON_SVG, LINK_ICON_SVG, EDIT_ICON_SVG } from "../../utils/admin-icons";

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
      const fileInput      = document.getElementById("fileInput") as HTMLInputElement;
      const dropZone       = document.getElementById("dropZone")!;
      const uploadBtn      = document.getElementById("uploadBtn") as HTMLButtonElement;
      const uploadFileName = document.getElementById("uploadFileName")!;
      const customKeyInput = document.getElementById("customKeyInput") as HTMLInputElement;
      const progressWrap   = document.getElementById("progressWrap")!;
      const progressBar    = document.getElementById("progressBar")!;
      const uploadStatus   = document.getElementById("uploadStatus")!;
      const filesTableBody = document.getElementById("filesTableBody") as HTMLTableSectionElement;
      const filesCount     = document.getElementById("filesCount")!;

      // ── Modal DOM refs ──────────────────────────────────────────────────────
      const editModal         = document.getElementById("editModal")!;
      const editModalBackdrop = document.getElementById("editModalBackdrop")!;
      const editModalClose    = document.getElementById("editModalClose") as HTMLButtonElement;
      const editCurrentName   = document.getElementById("editCurrentName")!;
      const editKeyInput      = document.getElementById("editKeyInput") as HTMLInputElement;
      const editDropZone      = document.getElementById("editDropZone")!;
      const editFileInput     = document.getElementById("editFileInput") as HTMLInputElement;
      const editFileNameEl    = document.getElementById("editFileName")!;
      const editStatus        = document.getElementById("editStatus")!;
      const editDeleteBtn     = document.getElementById("editDeleteBtn") as HTMLButtonElement;
      const editCancelBtn     = document.getElementById("editCancelBtn") as HTMLButtonElement;
      const editSaveBtn       = document.getElementById("editSaveBtn") as HTMLButtonElement;

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
      function setUploadStatus(type: "success" | "error" | "none", msg = "") {
        uploadStatus.className = "hidden p-3 font-medium rounded-xl border text-center";
        uploadStatus.style.fontSize = "14px";
        if (type === "none") return;
        uploadStatus.textContent = msg;
        uploadStatus.classList.remove("hidden");
        if (type === "success") uploadStatus.classList.add("bg-green-50","text-green-700","border-green-200");
        else uploadStatus.classList.add("bg-red-50","text-red-600","border-red-200");
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
                  <div style="width:2.25rem;height:2.25rem;border-radius:0.5rem;background:#f3f4f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${FILE_ICON_SVG}</div>
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

      // ── Upload ─────────────────────────────────────────────────────────────
      async function uploadFile() {
        if (!currentToken || !fileInput.files?.length) return;
        const file = fileInput.files[0];
        const fd = new FormData();
        fd.append("file", file);
        // Enviar enlace personalizado si el usuario lo proporcionó
        let customKey = customKeyInput.value.trim();
        if (customKey) {
          const ext = document.getElementById("customKeyExt")!.textContent;
          if (ext && !customKey.toLowerCase().endsWith(ext)) {
            customKey += ext;
          }
          fd.append("customKey", customKey);
        }
        uploadBtn.disabled = true;
        progressWrap.classList.remove("hidden");
        progressBar.style.width = "0%";
        setUploadStatus("none");
        let pct = 0;
        const timer = setInterval(() => { pct = Math.min(pct + 8, 85); progressBar.style.width = `${pct}%`; }, 150);
        try {
          const res = await fetch("/api/upload", { method: "POST", headers: { "Authorization": `Bearer ${currentToken}` }, body: fd });
          clearInterval(timer); progressBar.style.width = "100%";
          if (res.ok) {
            setUploadStatus("success", `"${file.name}" subido correctamente`);
            fileInput.value = ""; uploadFileName.textContent = ""; uploadFileName.classList.add("hidden");
            customKeyInput.value = "";
            uploadBtn.disabled = true; await loadFiles();
          } else {
            const body = await res.json() as UploadResponse;
            setUploadStatus("error", `Error: ${body.error ?? res.status}`);
          }
        } catch {
          clearInterval(timer);
          setUploadStatus("error", "Error de red. Inténtalo de nuevo.");
        } finally {
          setTimeout(() => { progressWrap.classList.add("hidden"); progressBar.style.width = "0%"; }, 1600);
        }
      }

      // ── Edit Modal ────────────────────────────────────────────────────────
      function setEditStatus(type: "success" | "error" | "none", msg = "") {
        editStatus.className = "hidden p-3 font-medium rounded-xl border text-center";
        editStatus.style.fontSize = "14px";
        if (type === "none") return;
        editStatus.textContent = msg;
        editStatus.classList.remove("hidden");
        if (type === "success") editStatus.classList.add("bg-green-50", "text-green-700", "border-green-200");
        else editStatus.classList.add("bg-red-50", "text-red-600", "border-red-200");
      }

      function openEditModal(key: string, name: string) {
        editingKey = key;
        editCurrentName.textContent = name;
        
        const lastDotIdx = key.lastIndexOf(".");
        let baseKey = key;
        let ext = "";
        if (lastDotIdx > 0) {
          baseKey = key.substring(0, lastDotIdx);
          ext = key.substring(lastDotIdx).toLowerCase();
        }

        editKeyInput.value = baseKey;
        const extSpan = document.getElementById("editKeyExt")!;
        if (ext) {
          extSpan.textContent = ext;
          extSpan.classList.remove("hidden");
        } else {
          extSpan.textContent = "";
          extSpan.classList.add("hidden");
        }
        editFileInput.value = "";
        editFileNameEl.textContent = "";
        editFileNameEl.classList.add("hidden");
        setEditStatus("none");
        editSaveBtn.disabled = false;
        editDeleteBtn.disabled = false;
        editModal.style.display = "flex";
      }

      function closeEditModal() {
        editModal.style.display = "none";
        editingKey = "";
        editFileInput.value = "";
        editFileNameEl.classList.add("hidden");
        setEditStatus("none");
      }

      async function saveEdit() {
        if (!currentToken) return;
        let newKey = editKeyInput.value.trim().replace(/[\/\\]/g, "");
        const file = editFileInput.files?.[0];

        if (!newKey) {
          setEditStatus("error", "El enlace no puede estar vacío.");
          return;
        }

        const extSpan = document.getElementById("editKeyExt")!;
        const ext = extSpan.textContent;
        if (ext && !newKey.toLowerCase().endsWith(ext)) {
          newKey += ext;
        }
        if (!file && newKey === editingKey) {
          setEditStatus("error", "No hay cambios que guardar.");
          return;
        }

        editSaveBtn.disabled = true;
        editDeleteBtn.disabled = true;
        setEditStatus("none");

        const fd = new FormData();
        fd.append("oldKey", editingKey);
        fd.append("newKey", newKey);
        if (file) fd.append("file", file);

        try {
          const res = await fetch("/api/files-manage", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${currentToken}` },
            body: fd,
          });
          if (res.ok) {
            setEditStatus("success", "Archivo actualizado correctamente.");
            await loadFiles();
            setTimeout(closeEditModal, 1200);
          } else {
            const body = await res.json() as UploadResponse;
            setEditStatus("error", `Error: ${body.error ?? res.status}`);
            editSaveBtn.disabled = false;
            editDeleteBtn.disabled = false;
          }
        } catch {
          setEditStatus("error", "Error de red. Inténtalo de nuevo.");
          editSaveBtn.disabled = false;
          editDeleteBtn.disabled = false;
        }
      }

      async function deleteFile(key: string) {
        if (!currentToken) return;
        if (!confirm(`¿Eliminar "${key}"?\nEsta acción no se puede deshacer.`)) return;

        editSaveBtn.disabled = true;
        editDeleteBtn.disabled = true;

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
            await loadFiles();
            closeEditModal();
          } else {
            const body = await res.json() as UploadResponse;
            setEditStatus("error", `Error: ${body.error ?? res.status}`);
            editSaveBtn.disabled = false;
            editDeleteBtn.disabled = false;
          }
        } catch {
          setEditStatus("error", "Error de red. Inténtalo de nuevo.");
          editSaveBtn.disabled = false;
          editDeleteBtn.disabled = false;
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
        setUploadStatus("none"); showLogin();
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

      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) { 
          uploadFileName.textContent = file.name; uploadFileName.classList.remove("hidden"); uploadBtn.disabled = false; setUploadStatus("none");
          const ext = file.name.includes(".") ? "." + file.name.split(".").pop()!.toLowerCase() : "";
          if (ext) {
            document.getElementById("customKeyExt")!.textContent = ext;
            document.getElementById("customKeyExt")!.classList.remove("hidden");
          } else {
            document.getElementById("customKeyExt")!.classList.add("hidden");
          }
        } else { 
          uploadFileName.classList.add("hidden"); uploadBtn.disabled = true;
          document.getElementById("customKeyExt")!.classList.add("hidden");
        }
      });
      uploadBtn.addEventListener("click", () => void uploadFile());
      dropZone.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--color-primary)";
        dropZone.style.background = "color-mix(in srgb, var(--color-primary) 5%, white)";
      });
      dropZone.addEventListener("dragleave", () => { dropZone.style.borderColor = ""; dropZone.style.background = ""; });
      dropZone.addEventListener("drop", (e: DragEvent) => {
        e.preventDefault(); dropZone.style.borderColor = ""; dropZone.style.background = "";
        const dropped = e.dataTransfer?.files;
        if (dropped?.length) { const dt = new DataTransfer(); dt.items.add(dropped[0]); fileInput.files = dt.files; fileInput.dispatchEvent(new Event("change")); }
      });
      async function copyToClipboard(text: string, btn: HTMLButtonElement) {
        try {
          await navigator.clipboard.writeText(text);
          showToast("¡Enlace copiado al portapapeles!", "success");
        } catch (err) {
          showToast("Error al copiar enlace", "error");
        }
      }

      // ── Dropdown toggle: abrir/cerrar al hacer clic en el engranaje ───────
      function closeAllDropdowns() {
        document.querySelectorAll(".actions-dropdown-menu.open").forEach(m => m.classList.remove("open"));
      }
      document.addEventListener("click", (e: MouseEvent) => {
        // Si el clic no fue dentro de un dropdown, cerrar todos
        if (!(e.target as HTMLElement).closest(".actions-dropdown")) closeAllDropdowns();
      });

      filesTableBody.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Toggle del dropdown
        const toggleBtn = target.closest<HTMLButtonElement>(".actions-toggle");
        if (toggleBtn) {
          e.stopPropagation();
          const menu = toggleBtn.nextElementSibling as HTMLElement;
          const wasOpen = menu.classList.contains("open");
          closeAllDropdowns();
          if (!wasOpen) menu.classList.add("open");
          return;
        }

        // Acciones del dropdown
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
        if (editBtn) { closeAllDropdowns(); openEditModal(editBtn.dataset["key"] ?? "", editBtn.dataset["name"] ?? ""); return; }
      });

      // ── Edit Modal Events ──────────────────────────────────────────────────
      editModalClose.addEventListener("click", closeEditModal);
      editModalBackdrop.addEventListener("click", closeEditModal);
      editCancelBtn.addEventListener("click", closeEditModal);
      editSaveBtn.addEventListener("click", () => void saveEdit());
      editDeleteBtn.addEventListener("click", () => void deleteFile(editingKey));

      editFileInput.addEventListener("change", () => {
        const file = editFileInput.files?.[0];
        if (file) {
          editFileNameEl.textContent = file.name;
          editFileNameEl.classList.remove("hidden");
          const ext = file.name.includes(".") ? "." + file.name.split(".").pop()!.toLowerCase() : "";
          const extSpan = document.getElementById("editKeyExt")!;
          if (ext) {
            extSpan.textContent = ext;
            extSpan.classList.remove("hidden");
          } else {
            extSpan.textContent = "";
            extSpan.classList.add("hidden");
          }
        } else {
          editFileNameEl.classList.add("hidden");
          const lastDotIdx = editingKey.lastIndexOf(".");
          const ext = lastDotIdx > 0 ? editingKey.substring(lastDotIdx).toLowerCase() : "";
          const extSpan = document.getElementById("editKeyExt")!;
          if (ext) {
            extSpan.textContent = ext;
            extSpan.classList.remove("hidden");
          } else {
            extSpan.textContent = "";
            extSpan.classList.add("hidden");
          }
        }
      });

      editDropZone.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        editDropZone.style.borderColor = "var(--color-primary)";
        editDropZone.style.background = "color-mix(in srgb, var(--color-primary) 5%, white)";
      });
      editDropZone.addEventListener("dragleave", () => {
        editDropZone.style.borderColor = "";
        editDropZone.style.background = "";
      });
      editDropZone.addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        editDropZone.style.borderColor = "";
        editDropZone.style.background = "";
        const dropped = e.dataTransfer?.files;
        if (dropped?.length) {
          const dt = new DataTransfer();
          dt.items.add(dropped[0]);
          editFileInput.files = dt.files;
          editFileInput.dispatchEvent(new Event("change"));
        }
      });

      // Cerrar modal con Escape
      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape" && editModal.style.display !== "none") closeEditModal();
      });

      void init();