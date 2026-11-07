
(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyOqhKHrfeUTbxjF6afnw1CMJWvQBzYZoPupwBIruOUd16X7549nVPwHAh-YhBCK3Yy/exec";

  const form = document.querySelector("#review-form");
  const feedback = document.querySelector("#form-feedback");
  const submitButton = document.querySelector("#submit-button");
  const year = document.querySelector("#year");

  if (!form || !feedback || !submitButton) return;

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function showFeedback(message, type = "success") {
    feedback.textContent = message;
    feedback.style.color = type === "error" ? "#b42318" : "#287a57";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Periksa seluruh input wajib
    if (!form.reportValidity()) return;

    const rating = form.querySelector(
      'input[name="rating"]:checked'
    );

    if (!rating) {
      showFeedback("Silakan pilih rating terlebih dahulu.", "error");
      return;
    }

    const consent = document.querySelector("#review-consent");

    if (!consent.checked) {
      showFeedback(
        "Silakan setujui penayangan ulasan terlebih dahulu.",
        "error"
      );
      return;
    }

    // Siapkan data ulasan
    const payload = {
      action: "submitReview",
      customerName: form.elements.customerName.value.trim(),
      productName: form.elements.productName.value.trim(),
      rating: Number(rating.value),
      comment: form.elements.comment.value.trim()
    };

    // Cegah pengiriman berulang saat proses berlangsung
    submitButton.disabled = true;
    submitButton.textContent = "Mengirim ulasan...";
    showFeedback("Sedang mengirim ulasan...", "success");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Server tidak dapat memproses permintaan.");
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          result.message || "Ulasan gagal dikirim."
        );
      }

      form.reset();

      showFeedback(
        "Terima kasih! Ulasan berhasil dikirim dan sedang menunggu pemeriksaan admin."
      );

    } catch (error) {
      console.error("Submit review error:", error);

      showFeedback(
        error.message || "Ulasan gagal dikirim. Silakan coba kembali.",
        "error"
      );

    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML =
        'Kirim ulasan <span aria-hidden="true">↗</span>';
    }
  });
})();
