
(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyOqhKHrfeUTbxjF6afnw1CMJWvQBzYZoPupwBIruOUd16X7549nVPwHAh-YhBCK3Yy/exec";

  const list = document.querySelector("#review-list");
  const filter = document.querySelector("#rating-filter");
  const productFilter = document.querySelector("#product-filter");
  const sort = document.querySelector("#sort-reviews");
  const averageElement = document.querySelector("#average-rating");
  const heroAverage = document.querySelector("#hero-average");
  const heroCount = document.querySelector("#hero-count");
  const totalReviews = document.querySelector("#total-reviews");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");
  const bars = document.querySelector("#rating-bars");

  console.log("KELAOR: elemen review-list =", list);

if (!list) {
  console.error("KELAOR: elemen #review-list tidak ditemukan");
  return;
}

  let reviews = [];

  const year = document.querySelector("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function formatDate(value) {
    if (!value) return "Tanggal tidak tersedia";

    const parts = value.split("-");

    const date = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date(value);

    if (isNaN(date.getTime())) {
      return "Tanggal tidak tersedia";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function getAverage(data) {
    if (!data.length) return "0.0";

    const total = data.reduce((sum, review) => {
      return sum + review.rating;
    }, 0);

    return (total / data.length).toFixed(1);
  }

  function updateSummary() {
    const average = getAverage(reviews);
    const count = reviews.length;

    if (averageElement) {
      averageElement.textContent = average;
    }

    if (heroAverage) {
      heroAverage.textContent = average;

      const suffix = document.createElement("span");
      suffix.textContent = "/5";
      heroAverage.appendChild(suffix);
    }

    if (heroCount) {
      heroCount.textContent = `${count} ulasan pelanggan`;
    }

    if (totalReviews) {
      totalReviews.textContent = `${count} ulasan pelanggan`;
    }

    if (!bars) return;

    bars.innerHTML = "";

    for (let score = 5; score >= 1; score--) {
      const countForRating = reviews.filter(review => {
        return review.rating === score;
      }).length;

      const percentage = count
        ? (countForRating / count) * 100
        : 0;

      const row = document.createElement("div");
      row.className = "rating-row";

      const scoreLabel = document.createElement("span");
      scoreLabel.textContent = score;

      const track = document.createElement("div");
      track.className = "bar-track";

      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${percentage}%`;

      const countLabel = document.createElement("span");
      countLabel.textContent = countForRating;

      track.appendChild(fill);
      row.append(scoreLabel, track, countLabel);
      bars.appendChild(row);
    }
  }

  function updateProductFilter() {
    if (!productFilter) return;

    const selectedValue = productFilter.value;

    const products = [...new Set(
      reviews.map(review => review.productName)
    )].sort((a, b) => a.localeCompare(b, "id"));

    productFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Semua produk";
    productFilter.appendChild(allOption);

    products.forEach(product => {
      const option = document.createElement("option");
      option.value = product;
      option.textContent = product;
      productFilter.appendChild(option);
    });

    productFilter.value = products.includes(selectedValue)
      ? selectedValue
      : "all";
  }

  function render() {
    const selectedRating = filter ? filter.value : "all";
    const selectedProduct = productFilter
      ? productFilter.value
      : "all";

    const ordered = reviews.filter(review => {
      const matchRating =
        selectedRating === "all" ||
        String(review.rating) === selectedRating;

      const matchProduct =
        selectedProduct === "all" ||
        review.productName === selectedProduct;

      return matchRating && matchProduct;
    });

    if (sort && sort.value === "newest") {
      ordered.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    }

    if (sort && sort.value === "highest") {
      ordered.sort((a, b) => b.rating - a.rating);
    }

    if (sort && sort.value === "lowest") {
      ordered.sort((a, b) => a.rating - b.rating);
    }

    list.innerHTML = "";

    ordered.forEach(review => {
      const card = document.createElement("article");
      card.className = "review-card";

      const top = document.createElement("div");
      top.className = "review-card-top";

      const customer = document.createElement("div");
      customer.className = "customer";

      const avatar = document.createElement("span");
      avatar.className = "avatar";

      const initials = review.customerName
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      avatar.textContent = initials || "?";

      const identity = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = review.customerName;

      const date = document.createElement("small");
      date.textContent = formatDate(review.createdAt);

      identity.append(name, date);
      customer.append(avatar, identity);
      top.appendChild(customer);

      if (review.verified) {
        const badge = document.createElement("span");
        badge.className = "verified";
        badge.textContent = "✓ Terverifikasi";
        top.appendChild(badge);
      }

      const stars = document.createElement("div");
      stars.className = "stars";
      stars.textContent =
        "★".repeat(review.rating) +
        "☆".repeat(5 - review.rating);

      const comment = document.createElement("p");
      comment.className = "review-comment";
      comment.textContent = review.comment;

      const footer = document.createElement("div");
      footer.className = "review-card-footer";

      const product = document.createElement("strong");
      product.textContent = review.productName;

      const label = document.createElement("span");
      label.textContent = "Pembelian";

      footer.append(product, label);
      card.append(top, stars, comment, footer);
      list.appendChild(card);
    });

    if (resultCount) {
      resultCount.textContent = `${ordered.length} ulasan`;
    }

    if (emptyState) {
      emptyState.classList.toggle("hidden", ordered.length > 0);
    }
  }

  async function loadReviews() {
    list.innerHTML = "";

    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Memuat ulasan pelanggan...";
    list.appendChild(loading);
    
console.log("KELAOR: mulai mengambil data API");

const response = await fetch(
  `${API_URL}?action=getApprovedReviews`,
  { cache: "no-store" }
); 
    
    try {
      const response = await fetch(
        `${API_URL}?action=getApprovedReviews`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Gagal menghubungi server.");
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          result.message || "Gagal mengambil data ulasan."
        );
      }

      reviews = Array.isArray(result.data)
        ? result.data.filter(review => {
            return (
              review &&
              Number.isInteger(Number(review.rating)) &&
              Number(review.rating) >= 1 &&
              Number(review.rating) <= 5
            );
          }).map(review => ({
            customerName: String(review.customerName || ""),
            productName: String(review.productName || ""),
            rating: Number(review.rating),
            comment: String(review.comment || ""),
            createdAt: String(review.createdAt || ""),
            verified: review.verified === true
          }))
        : [];

      updateSummary();
      updateProductFilter();
      render();

    } catch (error) {
      console.error("Load reviews error:", error);

      list.innerHTML = "";

      const message = document.createElement("p");
      message.className = "muted";
      message.textContent =
        "Ulasan belum dapat dimuat. Silakan coba beberapa saat lagi.";

      list.appendChild(message);

      if (heroAverage) {
        heroAverage.textContent = "—";
      }

      if (averageElement) {
        averageElement.textContent = "—";
      }

      if (heroCount) {
        heroCount.textContent = "Gagal memuat ulasan";
      }

      if (totalReviews) {
        totalReviews.textContent = "Gagal memuat ulasan";
      }

      if (resultCount) {
        resultCount.textContent = "—";
      }

      if (bars) {
        bars.innerHTML = "";
      }
    }
  }

  if (filter) filter.addEventListener("change", render);
  if (productFilter) productFilter.addEventListener("change", render);
  if (sort) sort.addEventListener("change", render);

  loadReviews();
})();
