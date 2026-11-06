
(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyOqhKHrfeUTbxjF6afnw1CMJWvQBzYZoPupwBIruOUd16X7549nVPwHAh-YhBCK3Yy/exec";

  const form = document.querySelector("#review-form");
  const feedback = document.querySelector("#form-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  document.querySelector("#year").textContent = new Date().getFullYear();

  // Hapus pemberitahuan mode pratinjau
  const demoAlert = document.querySelector(".form-demo-alert");
  if (demoAlert) {
    demoAlert.textContent =
      "Ulasan akan diperiksa oleh admin sebelum ditampilkan di website.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const rating = form.querySelector(
      'input[name="rating"]:checked'
    );

    if (!rating) {
      feedback.textContent = "Silakan pilih rating terlebih dahulu.";
      return;
    }

    const payload = {
      action: "submitReview",
      customerName: form.elements.customerName.value.trim(),
      productName: form.elements.productName.value.trim(),
      rating: Number(rating.value),
      comment: form.elements.comment.value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Mengirim ulasan...";
    feedback.textContent = "";

    try {
      const response = await fetch(API_URL, {
     method: "POST",
     redirect: "follow",
     headers: {
     "Content-Type": "text/plain;charset=utf-8"
     },
     body: JSON.stringify(payload)
     });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Ulasan gagal dikirim.");
      }

      feedback.textContent =
        "Terima kasih! Ulasan berhasil dikirim.";

      form.reset();

      
    } catch (error) {
      console.error("Submit review error:", error);

      feedback.textContent =
        "Ulasan belum berhasil dikirim. Silakan coba lagi. Jika masalah berlanjut, periksa koneksi backend.";

    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML =
        'Kirim ulasan <span aria-hidden="true">↗</span>';
    }
  });
})();
