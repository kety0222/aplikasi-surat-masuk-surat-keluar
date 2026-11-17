
let daftarSurat = JSON.parse(
    localStorage.getItem("daftarSurat")
) || [];

// MENGGANTI HALAMAN
function bukaHalaman(id) {
    document.querySelectorAll(".halaman").forEach(halaman => {
        halaman.hidden = true;
    });

    document.getElementById(id).hidden = false;

    if (id === "data") tampilkanData();
    perbaruiDashboard();
}

// MENYIMPAN DATA
function simpanData() {
    try {
        localStorage.setItem(
            "daftarSurat",
            JSON.stringify(daftarSurat)
        );
        return true;
    } catch (error) {
        alert("Penyimpanan penuh. Kurangi ukuran atau jumlah file PDF.");
        return false;
    }
}

// MEMBUAT ID
function buatID() {
    return Date.now().toString() +
        Math.random().toString(36).substring(2, 8);
}

// MENGAMBIL NOMOR AGENDA
function nomorAgenda() {
    return "AG-" + String(daftarSurat.length + 1).padStart(4, "0");
}

// MENCEGAH HTML DARI INPUT PENGGUNA
function aman(teks) {
    return String(teks ?? "").replace(/[&<>"']/g, huruf => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[huruf]);
}

// FORM TAMBAH DAN EDIT
document.getElementById("formSurat").addEventListener(
    "submit",
    async function(e) {
        e.preventDefault();

        const id = document.getElementById("idSurat").value;
        const jenis = document.getElementById("jenis").value;
        const nomor = document.getElementById("nomor").value.trim();
        const tanggal = document.getElementById("tanggal").value;
        const tanggalProses = document.getElementById("tanggalProses").value;
        const nama = document.getElementById("nama").value.trim();
        const perihal = document.getElementById("perihal").value.trim();
        const inputFile = document.getElementById("fileSurat");

        if (!jenis || !nomor || !tanggal ||
            !tanggalProses || !nama || !perihal) {
            alert("Lengkapi semua data terlebih dahulu!");
            return;
        }

        const indeks = daftarSurat.findIndex(s => s.id === id);

        let file = indeks >= 0
            ? daftarSurat[indeks].file
            : null;

        if (inputFile.files.length > 0) {
            const pdf = inputFile.files[0];

            if (pdf.type !== "application/pdf" ||
                !pdf.name.toLowerCase().endsWith(".pdf")) {
                alert("File harus berformat PDF!");
                return;
            }

            if (pdf.size > 1024 * 1024) {
                alert("Ukuran PDF maksimal 1 MB!");
                return;
            }

            try {
                file = {
                    nama: pdf.name,
                    data: await bacaFile(pdf)
                };
            } catch (error) {
                alert("Gagal membaca file PDF!");
                return;
            }
        }

        const dataBaru = {
            id: id || buatID(),
            agenda: indeks >= 0
                ? daftarSurat[indeks].agenda
                : nomorAgenda(),
            jenis,
            nomor,
            tanggal,
            tanggalProses,
            nama,
            perihal,
            file
        };

        const dataLama = daftarSurat.slice();

        if (indeks >= 0) {
            daftarSurat[indeks] = dataBaru;
        } else {
            daftarSurat.push(dataBaru);
        }

        if (!simpanData()) {
            daftarSurat = dataLama;
            return;
        }

        alert(indeks >= 0
            ? "Data surat berhasil diperbarui!"
            : "Surat berhasil disimpan!");

        resetForm();
        bukaHalaman("data");
    }
);

// MEMBACA FILE PDF
function bacaFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
    });
}

// MENAMPILKAN DATA SURAT
function tampilkanData() {
    const tabel = document.getElementById("isiTabel");
    const filter = document.getElementById("filterJenis").value;
    const cari = document.getElementById("pencarian")
        .value.toLowerCase();

    const hasil = daftarSurat.filter(s => {
        const cocokJenis =
            filter === "semua" || s.jenis === filter;

        const cocokCari = [
            s.agenda, s.jenis, s.nomor,
            s.tanggal, s.nama, s.perihal
        ].join(" ").toLowerCase().includes(cari);

        return cocokJenis && cocokCari;
    });

    if (hasil.length === 0) {
        tabel.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center">
                    Belum ada data surat.
                </td>
            </tr>
        `;
        return;
    }

    tabel.innerHTML = hasil.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${aman(s.agenda)}</td>
            <td>${s.jenis === "masuk"
                ? "Surat Masuk" : "Surat Keluar"}</td>
            <td>${aman(s.nomor)}</td>
            <td>${aman(s.tanggal)}</td>
            <td>${aman(s.nama)}</td>
            <td>${aman(s.perihal)}</td>
            <td>
                ${s.file
                    ? `<button class="unduh"
                        onclick="unduhFile('${s.id}')">
                        Lihat PDF
                       </button>`
                    : "Tidak ada file"}
            </td>
            <td>
                <button class="edit"
                    onclick="editSurat('${s.id}')">
                    Edit
                </button>

                <button class="hapus"
                    onclick="hapusSurat('${s.id}')">
                    Hapus
                </button>
            </td>
        </tr>
    `).join("");
}

// EDIT SURAT
function editSurat(id) {
    const surat = daftarSurat.find(s => s.id === id);

    if (!surat) return;

    document.getElementById("idSurat").value = surat.id;
    document.getElementById("jenis").value = surat.jenis;
    document.getElementById("nomor").value = surat.nomor;
    document.getElementById("tanggal").value = surat.tanggal;
    document.getElementById("tanggalProses").value =
        surat.tanggalProses;
    document.getElementById("nama").value = surat.nama;
    document.getElementById("perihal").value = surat.perihal;

    document.getElementById("judulForm").textContent =
        "Edit Data Surat";

    document.getElementById("tombolSimpan").textContent =
        "Perbarui Surat";

    document.getElementById("infoFile").textContent =
        surat.file ? "File saat ini: " + surat.file.nama
        : "Belum ada file PDF";

    bukaHalaman("tambah");
}

// HAPUS SURAT
function hapusSurat(id) {
    const yakin = confirm(
        "Apakah Anda yakin ingin menghapus surat ini?"
    );

    if (!yakin) return;

    const dataLama = daftarSurat.slice();

    daftarSurat = daftarSurat.filter(s => s.id !== id);

    if (!simpanData()) {
        daftarSurat = dataLama;
        return;
    }

    tampilkanData();
    perbaruiDashboard();

    alert("Data surat berhasil dihapus!");
}

// DOWNLOAD / LIHAT PDF
function unduhFile(id) {
    const surat = daftarSurat.find(s => s.id === id);

    if (!surat || !surat.file) return;

    const link = document.createElement("a");

    link.href = surat.file.data;
    link.download = surat.file.nama;

    document.body.appendChild(link);
    link.click();
    link.remove();
}

// RESET FORM
function resetForm() {
    document.getElementById("formSurat").reset();

    document.getElementById("idSurat").value = "";

    document.getElementById("judulForm").textContent =
        "Tambah Surat";

    document.getElementById("tombolSimpan").textContent =
        "Simpan Surat";

    document.getElementById("infoFile").textContent = "";
}

// DASHBOARD
function perbaruiDashboard() {
    const masuk = daftarSurat.filter(
        s => s.jenis === "masuk"
    ).length;

    const keluar = daftarSurat.filter(
        s => s.jenis === "keluar"
    ).length;

    document.getElementById("totalSurat").textContent =
        daftarSurat.length;

    document.getElementById("totalMasuk").textContent = masuk;
    document.getElementById("totalKeluar").textContent = keluar;

    document.getElementById("laporanMasuk").textContent = masuk;
    document.getElementById("laporanKeluar").textContent = keluar;
}

// LAPORAN
function cetakLaporan() {
    bukaHalaman("laporan");

    const laporan = document.getElementById("laporan");
    let tabel = document.getElementById("laporanTabel");

    if (!tabel) {
        tabel = document.createElement("div");
        tabel.id = "laporanTabel";
        laporan.appendChild(tabel);
    }

    tabel.innerHTML = `
        <h3>Daftar Arsip Surat</h3>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Agenda</th>
                    <th>Jenis</th>
                    <th>Nomor Surat</th>
                    <th>Tanggal</th>
                    <th>Pengirim / Tujuan</th>
                    <th>Perihal</th>
                </tr>
            </thead>
            <tbody>
                ${daftarSurat.map((s, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${aman(s.agenda)}</td>
                        <td>${s.jenis === "masuk"
                            ? "Masuk" : "Keluar"}</td>
                        <td>${aman(s.nomor)}</td>
                        <td>${aman(s.tanggal)}</td>
                        <td>${aman(s.nama)}</td>
                        <td>${aman(s.perihal)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    window.print();
}

// MENJALANKAN APLIKASI
perbaruiDashboard();
tampilkanData();
