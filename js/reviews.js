(() => {
  const reviews = window.KELAOR_SAMPLE_REVIEWS || [];
  const list = document.querySelector("#review-list");
  const filter = document.querySelector("#rating-filter");
  const sort = document.querySelector("#sort-reviews");
  const average = reviews.length ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : "—";
  const fmt = date => new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(new Date(date+"T00:00:00"));
  document.querySelector("#hero-average").innerHTML = `${average}<span>/5</span>`;
  document.querySelector("#average-rating").textContent = average;
  document.querySelector("#hero-count").textContent = `${reviews.length} ulasan contoh`;
  document.querySelector("#total-reviews").textContent = `${reviews.length} ulasan contoh`;
  document.querySelector("#year").textContent = new Date().getFullYear();

  const bars = document.querySelector("#rating-bars");
  for(let score=5;score>=1;score--){
    const count=reviews.filter(r=>r.rating===score).length;
    const row=document.createElement("div"); row.className="rating-row";
    row.innerHTML=`<span>${score}</span><div class="bar-track"><div class="bar-fill" style="width:${reviews.length?count/reviews.length*100:0}%"></div></div><span>${count}</span>`;
    bars.append(row);
  }
  function render(){
    const selected=filter.value;
    const ordered=[...reviews].filter(r=>selected==="all"||String(r.rating)===selected);
    if(sort.value==="newest") ordered.sort((a,b)=>b.date.localeCompare(a.date));
    if(sort.value==="highest") ordered.sort((a,b)=>b.rating-a.rating);
    if(sort.value==="lowest") ordered.sort((a,b)=>a.rating-b.rating);
    list.innerHTML="";
    ordered.forEach(r=>{
      const card=document.createElement("article"); card.className="review-card";
      const initials=r.name.trim().split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase();
      const top=document.createElement("div");top.className="review-card-top";
      const customer=document.createElement("div");customer.className="customer";
      const avatar=document.createElement("span");avatar.className="avatar";avatar.textContent=initials;
      const identity=document.createElement("div");const name=document.createElement("strong");name.textContent=r.name;const date=document.createElement("small");date.textContent=fmt(r.date);identity.append(name,date);customer.append(avatar,identity);
      top.append(customer);
      if(r.verified){const badge=document.createElement("span");badge.className="verified";badge.textContent="✓ Terverifikasi";top.append(badge);}
      const stars=document.createElement("div");stars.className="stars";stars.textContent="★".repeat(r.rating)+"☆".repeat(5-r.rating);
      const comment=document.createElement("p");comment.className="review-comment";comment.textContent=r.comment;
      const footer=document.createElement("div");footer.className="review-card-footer";const product=document.createElement("strong");product.textContent=r.product;const label=document.createElement("span");label.textContent="Pembelian";footer.append(product,label);
      card.append(top,stars,comment,footer);list.append(card);
    });
    document.querySelector("#result-count").textContent=`${ordered.length} ulasan`;
    document.querySelector("#empty-state").classList.toggle("hidden",ordered.length!==0);
  }
  filter.addEventListener("change",render);sort.addEventListener("change",render);render();
})();
