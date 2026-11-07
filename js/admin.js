
(() => {
  "use strict";

  const API_URL = "https://script.google.com/macros/s/AKfycbyOqhKHrfeUTbxjF6afnw1CMJWvQBzYZoPupwBIruOUd16X7549nVPwHAh-YhBCK3Yy/exec";

  const loginSection = document.querySelector("#login-section");
  const dashboardSection = document.querySelector("#dashboard-section");
  const loginForm = document.querySelector("#login-form");
  const passwordInput = document.querySelector("#admin-password");
  const loginButton = document.querySelector("#login-button");
  const loginMessage = document.querySelector("#login-message");
  const dashboardMessage = document.querySelector("#dashboard-message");
  const reviewsList = document.querySelector("#reviews-list");
  const reviewsLoading = document.querySelector("#reviews-loading");
  const reviewsEmpty = document.querySelector("#reviews-empty");
  const reviewFilter = document.querySelector("#review-filter");

  let reviews = [];
  let sessionToken = sessionStorage.getItem("kelaor_admin_session");

  async function apiRequest(payload) {
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
      throw new Error(result.message || "Permintaan gagal.");
    }

    return result;
  }

  function showLogin(message = "") {
    loginSection.hidden = false;
    dashboardSection.hidden = true;
    loginMessage.textContent = message;
    passwordInput.value = "";
  }

  function showDashboard() {
    loginSection.hidden = true;
    dashboardSection.hidden = false;
  }

  function showDashboardMessage(message, type = "info") {
    dashboardMessage.textContent = message;
    dashboardMessage.dataset.type = type;
  }

  async function login(password) {
    loginButton.disabled = true;
    loginButton.textContent = "Memeriksa...";

    try {
      const result = await apiRequest({
        action: "adminLogin",
        password: password
      });

      sessionToken = result.data.sessionToken;
      sessionStorage.setItem("kelaor_admin_session", sessionToken);

      showDashboard();
      await loadReviews();

    } catch (error) {
      loginMessage.textContent = error.message;
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Masuk Dashboard";
    }
  }

  async function loadReviews() {
    reviewsLoading.hidden = false;
    reviewsList.replaceChildren();
    reviewsEmpty.hidden = true;

    try {
      const result = await apiRequest({
        action: "adminGetReviews",
        sessionToken: sessionToken
      });

      reviews = Array.isArray(result.data) ? result.data : [];

      updateStatistics();
      renderReviews();

      showDashboardMessage("Data ulasan berhasil diperbarui.", "success");

    } catch (error) {
      if (error.message.toLowerCase().includes("sesi admin")) {
        sessionStorage.removeItem("kelaor_admin_session");
        sessionToken = null;
        showLogin("Sesi admin berakhir. Silakan login kembali.");
        return;
      }

      showDashboardMessage(error.message, "error");
    } finally {
      reviewsLoading.hidden = true;
    }
  }

  function updateStatistics() {
    const total = reviews.length;
    const pending = reviews.filter(item => item.status === "Pending").length;
    const approved = reviews.filter(item => item.status === "Approved").length;

    const ratings = reviews
      .map(item => Number(item.rating))
      .filter(rating => Number.isFinite(rating) && rating >= 1 && rating <= 5);

    const average = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

    document.querySelector("#stat-total").textContent = total;
    document.querySelector("#stat-average").textContent = average.toFixed(1) + " ★";
    document.querySelector("#stat-pending").textContent = pending;
    document.querySelector("#stat-approved").textContent = approved;
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function createActionButton(label, className, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", callback);
    return button;
  }

  function renderReviews() {
    reviewsList.replaceChildren();

    const selectedStatus = reviewFilter.value;

    const filteredReviews = reviews.filter(review => {
      return selectedStatus === "All" || review.status === selectedStatus;
    });

    reviewsEmpty.hidden = filteredReviews.length !== 0;

    filteredReviews.forEach(review => {
      const card = document.createElement("article");
      card.className = "admin-review-card";

      const header = document.createElement("div");
      header.className = "admin-review-header";

      const customer = document.createElement("div");

      const customerName = document.createElement("strong");
      customerName.textContent = review.customerName || "Pelanggan";

      const date = document.createElement("small");
      date.textContent = formatDate(review.createdAt);

      customer.append(customerName, date);

      const status = document.createElement("span");
      status.className = "status status-" + String(review.status).toLowerCase();
      status.textContent = review.status;

      header.append(customer, status);

      const product = document.createElement("h3");
      product.textContent = review.productName || "Produk";

      const rating = document.createElement("div");
      rating.className = "admin-review-rating";
      rating.textContent = "★".repeat(
        Math.max(0, Math.min(5, Number(review.rating) || 0))
      ) + "☆".repeat(
        5 - Math.max(0, Math.min(5, Number(review.rating) || 0))
      );

      const comment = document.createElement("p");
      comment.className = "admin-review-comment";
      comment.textContent = review.comment || "";

      const actions = document.createElement("div");
      actions.className = "admin-review-actions";

      if (review.status !== "Approved") {
        actions.appendChild(
          createActionButton("Setujui", "button button-primary", () => {
            changeStatus(review.reviewId, "Approved");
          })
        );
      }

      if (review.status !== "Rejected") {
        actions.appendChild(
          createActionButton("Tolak", "button button-outline", () => {
            changeStatus(review.reviewId, "Rejected");
          })
        );
      }

      actions.appendChild(
        createActionButton("Hapus", "button button-danger", () => {
          removeReview(review.reviewId);
        })
      );

      card.append(header, product, rating, comment, actions);
      reviewsList.appendChild(card);
    });
  }

  async function changeStatus(reviewId, status) {
    const confirmation = confirm(
      "Apakah kamu yakin ingin mengubah status ulasan menjadi " + status + "?"
    );

    if (!confirmation) return;

    try {
      await apiRequest({
        action: "adminUpdateReviewStatus",
        sessionToken: sessionToken,
        reviewId: reviewId,
        status: status
      });

      showDashboardMessage("Status ulasan berhasil diperbarui.", "success");
      await loadReviews();

    } catch (error) {
      showDashboardMessage(error.message, "error");
    }
  }

  async function removeReview(reviewId) {
    const confirmation = confirm(
      "Ulasan ini akan dihapus permanen dari Google Sheets. Lanjutkan?"
    );

    if (!confirmation) return;

    try {
      await apiRequest({
        action: "adminDeleteReview",
        sessionToken: sessionToken,
        reviewId: reviewId
      });

      showDashboardMessage("Ulasan berhasil dihapus.", "success");
      await loadReviews();

    } catch (error) {
      showDashboardMessage(error.message, "error");
    }
  }

  async function logout() {
    try {
      await apiRequest({
        action: "adminLogout",
        sessionToken: sessionToken
      });
    } catch (error) {
      // Sesi mungkin sudah berakhir di server.
    }

    sessionStorage.removeItem("kelaor_admin_session");
    sessionToken = null;
    reviews = [];
    showLogin("Kamu sudah logout.");
  }

  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const password = passwordInput.value;

    if (!password) {
      loginMessage.textContent = "Masukkan password admin.";
      return;
    }

    login(password);
  });

  document.querySelector("#refresh-button").addEventListener("click", loadReviews);
  document.querySelector("#logout-button").addEventListener("click", logout);
  reviewFilter.addEventListener("change", renderReviews);

  async function start() {
    if (!sessionToken) {
      showLogin();
      return;
    }

    showDashboard();
    await loadReviews();
  }

  start();
})();
