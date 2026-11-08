(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyWVjdHA_9Lbr24DQzMe1uFpdHkOAtWVWAMAmH_9ddjh04YN97VLvunWW2vB7SR8HOP/exec";
  const form = document.querySelector("#review-form");
  const feedback = document.querySelector("#form-feedback");
  const submitButton = document.querySelector("#submit-button");
  const year = document.querySelector("#year");

  if (!form || !feedback || !submitButton) return;
  if (year) year.textContent = new Date().getFullYear();

  function showFeedback(message, type = "success") {
    feedback.textContent = message;
    feedback.style.color =
      type === "error" ? "#b42318" : "#287a57";
  }

  // Buat iframe untuk menerima respons
  const iframe = document.createElement("iframe");
  iframe.name = "kelaor-review-frame";
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  // Form khusus untuk mengirim data ke Apps Script
  const hiddenForm = document.createElement("form");
  hiddenForm.method = "POST";
  hiddenForm.action = API_URL;
  hiddenForm.target = iframe.name;
  hiddenForm.enctype = "application/x-www-form-urlencoded";
  hiddenForm.style.display = "none";
  document.body.appendChild(hiddenForm);

  let isSubmitting = false;
  let submitTimeout = null;

  function resetButton() {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML =
      'Kirim ulasan <span aria-hidden="true">→</span>';
    if (submitTimeout) {
      clearTimeout(submitTimeout);
      submitTimeout = null;
    }
  }

  // Mengembalikan form dan tombol ke keadaan semula saat berhasil
  function handleSuccess(message = "Ulasan berhasil dikirim. Terima kasih!") {
    if (!isSubmitting) return;
    resetButton();
    form.reset();
    showFeedback(message, "success");
  }

  // Mendeteksi selesainya submit ketika iframe memuat respons dari server
  iframe.addEventListener("load", () => {
    if (!isSubmitting) return;
    
    // Beri jeda singkat agar pesan postMessage sempat terbaca jika ada
    setTimeout(() => {
      if (isSubmitting) {
        handleSuccess();
      }
    }, 350);
  });

  // Menerima konfirmasi dari response.html jika dialihkan oleh server
  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) return;
    if (
      !event.data ||
      event.data.type !== "KELAOR_REVIEW_SUBMIT"
    ) return;
    if (!isSubmitting) return;

    const result = event.data.result;
    if (!result || !result.ok) {
      resetButton();
      showFeedback(
        result?.message || "Ulasan gagal dikirim.",
        "error"
      );
      return;
    }

    handleSuccess(result.message || "Ulasan berhasil dikirim. Terima kasih!");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.reportValidity()) return;

    const rating = form.querySelector(
      'input[name="rating"]:checked'
    );
    if (!rating) {
      showFeedback("Silakan pilih rating.", "error");
      return;
    }

    const consent = document.querySelector("#review-consent");
    if (!consent || !consent.checked) {
      showFeedback(
        "Silakan setujui penayangan ulasan.",
        "error"
      );
      return;
    }

    const payload = {
      action: "submitReview",
      customerName: form.elements.customerName.value.trim(),
      productName: form.elements.productName.value.trim(),
      rating: rating.value,
      comment: form.elements.comment.value.trim()
    };

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Mengirim ulasan...";
    showFeedback("Sedang mengirim ulasan...");

    hiddenForm.replaceChildren();
    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      hiddenForm.appendChild(input);
    });

    hiddenForm.submit();

    // Timeout pengaman jika koneksi internet terputus
    submitTimeout = setTimeout(() => {
      if (!isSubmitting) return;
      resetButton();
      showFeedback(
        "Respons server memakan waktu lebih lama dari biasanya. Silakan periksa dashboard ulasan.",
        "error"
      );
    }, 20000);
  });
})();
