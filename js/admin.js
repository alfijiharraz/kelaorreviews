(() => {
  document.querySelector("#demo-refresh").addEventListener("click",()=>alert("Ini masih pratinjau frontend. Data belum terhubung ke database."));
  document.querySelector("#create-link").addEventListener("click",()=>alert("Pembuatan link khusus akan dibuat pada fase backend."));
  document.querySelectorAll(".table-action").forEach(button=>button.addEventListener("click",()=>alert("Moderasi ulasan akan aktif setelah autentikasi admin dan backend tersedia.")));
})();
