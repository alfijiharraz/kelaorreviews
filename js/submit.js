
(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyWVjdHA_9Lbr24DQzMe1uFpdHkOAtWVWAMAmH_9ddjh04YN97VLvunWW2vB7SR8HOP/exec";

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

  // Membuat iframe tersembunyi untuk mengirim formulir
  const iframeName = "kelaor-review-submit-frame";

  let iframe = document.querySelector(
    `#${iframeName}`
  );

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.id = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  // Form tersembunyi yang akan dikirim ke Apps Script
  const hiddenForm = document.createElement("form");
  hiddenForm.method = "POST";
  hiddenForm.action = API_URL;
  hiddenForm.target = iframeName;
  hiddenForm.style.display = "none";

  document.body.appendChild(hiddenForm);

  let isSubmitting = false;
  let submitTimeout;

  function resetButton() {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML =
      'Kirim ulasan <span aria-hidden="true">↗</span>';

    if (submitTimeout) {
      clearTimeout(submitTimeout);
      submitTimeout = null;
    }
  }

  // Menerima hasil dari Apps Script
  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) return;

    if (
      !event.data ||
      event.data.type !== "KELAOR_REVIEW_SUBMIT"
    ) {
      return;
    }

    const result = event.data.result;

    resetButton();

    if (!result || !result.ok) {
      showFeedback(
        result?.message || "Ulasan gagal dikirim. Silakan coba kembali.",
        "error"
      );
      return;
    }

    form.reset();

    showFeedback(
      "Terima kasih! Ulasan berhasil dikirim dan sedang menunggu pemeriksaan admin."
    );
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!form.reportValidity()) return;

    const rating = form.querySelector(
      'input[name="rating"]:checked'
    );

    if (!rating) {
      showFeedback(
        "Silakan pilih rating terlebih dahulu.",
        "error"
      );
      return;
    }

    const consent = document.querySelector("#review-consent");

    if (!consent || !consent.checked) {
      showFeedback(
        "Silakan setujui penayangan ulasan terlebih dahulu.",
        "error"
      );
      return;
    }

    const payload = {
      action: "submitReview",
      customerName: form.elements.customerName.value.trim(),
      productName: form.elements.productName.value.trim(),
      rating: Number(rating.value),
      comment: form.elements.comment.value.trim()
    };

    isSubmitting = true;

    submitButton.disabled = true;
    submitButton.textContent = "Mengirim ulasan...";

    showFeedback("Sedang mengirim ulasan...");

    // Bersihkan input form tersembunyi sebelumnya
    hiddenForm.innerHTML = "";

    // Masukkan seluruh data ke form tersembunyi
    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = String(value);

      hiddenForm.appendChild(input);
    });

    // Kirim ke Google Apps Script
    hiddenForm.submit();

    // Pengaman jika server tidak memberikan respons
    submitTimeout = setTimeout(() => {
      if (!isSubmitting) return;

      resetButton();

      showFeedback(
        "Server belum memberikan respons. Periksa koneksi dan coba kembali.",
        "error"
      );
    }, 20000);
  });
})();
