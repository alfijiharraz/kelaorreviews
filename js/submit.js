
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
    feedback.style.color =
      type === "error" ? "#b42318" : "#287a57";
  }

  // Siapkan iframe tersembunyi.
  const iframeName = "kelaor-review-frame";

  let iframe = document.getElementById(iframeName);

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = iframeName;
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  // Siapkan form khusus untuk mengirim data ke Apps Script.
  const hiddenForm = document.createElement("form");

  hiddenForm.method = "POST";
  hiddenForm.action = API_URL;
  hiddenForm.target = iframeName;
  hiddenForm.enctype = "application/x-www-form-urlencoded";
  hiddenForm.style.display = "none";

  document.body.appendChild(hiddenForm);

  let isSubmitting = false;
  let submitTimeout = null;

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

  // Terima respons dari response.html di domain website sendiri.
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== iframe.contentWindow) return;

    if (
      !event.data ||
      event.data.type !== "KELAOR_REVIEW_SUBMIT"
    ) {
      return;
    }

    if (!isSubmitting) return;

    const result = event.data.result;

    resetButton();

    if (!result || !result.ok) {
      showFeedback(
        result?.message || "Ulasan gagal dikirim.",
        "error"
      );
      return;
    }

    form.reset();

    showFeedback(
      result.message ||
      "Terima kasih! Ulasan berhasil dikirim dan menunggu pemeriksaan admin."
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

    submitTimeout = setTimeout(() => {
      if (!isSubmitting) return;

      resetButton();

      showFeedback(
        "Server belum memberikan respons. Periksa koneksi dan status ulasan sebelum mencoba lagi.",
        "error"
      );
    }, 20000);
  });
})();
