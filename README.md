# autoencoder-ai

Website statis interaktif (HTML/CSS/Vanilla JS) untuk memvisualisasikan arsitektur **Autoencoder**:

**Input → Encoder → Bottleneck → Decoder → Output**

Fokusnya adalah membantu mahasiswa memahami:
- bagaimana data dikompresi di encoder,
- peran bottleneck (latent space),
- bagaimana decoder merekonstruksi kembali menjadi output.

## Menjalankan

Cara paling sederhana:
- Buka `index.html` di browser.

Alternatif (opsional) dengan VS Code Live Server:
- Install extension **Live Server**
- Klik kanan `index.html` → **Open with Live Server**

## Deploy ke GitHub Pages

1. Push repo ini ke GitHub.
2. Buka **Settings** → **Pages**.
3. Pada **Build and deployment**, pilih:
	- **Source**: `Deploy from a branch`
	- **Branch**: `main` (atau `master`) dan folder root (`/`).
4. Tunggu sampai GitHub Pages memberikan URL.

Semua file sudah statis (tanpa backend), jadi aman untuk GitHub Pages.