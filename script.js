let cards = [];
let deck = [];

function filterCards() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  // 文明選択
  const selectedCivs = [];
  if (document.getElementById("civilizationFire").checked) selectedCivs.push("火");
  if (document.getElementById("civilizationWater").checked) selectedCivs.push("水");
  if (document.getElementById("civilizationNature").checked) selectedCivs.push("自然");
  if (document.getElementById("civilizationDarkness").checked) selectedCivs.push("闇");
  if (document.getElementById("civilizationLight").checked) selectedCivs.push("光");

  // 単色検索モードON/OFF
  const singleColorOnly = document.getElementById("singleColorOnly").checked;

  // 他の検索条件を取得
  const typeFilter = document.getElementById("typeFilter").value;
  const raceFilter = document.getElementById("raceFilter").value.toLowerCase();
  const minPowerInput = document.getElementById("minPower").value;
  const maxPowerInput = document.getElementById("maxPower").value;
  const minPower = minPowerInput === "" ? null : Number(minPowerInput);
  const maxPower = maxPowerInput === "" ? null : Number(maxPowerInput);

  const filtered = cards.filter(card => {
    // カード名検索
    const nameMatch = card.name.toLowerCase().includes(keyword);

    // 文明取得
    let cardCivs = [];
    if (card.type === "ツインパクト") {
      cardCivs = [...new Set([...card.parts.upper.civilization, ...card.parts.lower.civilization])];
    } else if (Array.isArray(card.civilization)) {
      cardCivs = card.civilization;
    } else {
      cardCivs = [card.civilization];
    }

    // 文明フィルタ
    let civMatch = false;
    if (selectedCivs.length === 0) {
      civMatch = true;
    } else if (singleColorOnly) {
      civMatch = (cardCivs.length === 1) && selectedCivs.includes(cardCivs[0]);
    } else {
      civMatch = selectedCivs.every(civ => cardCivs.includes(civ));
    }

    // カード種類フィルタ
    const typeMatch = (typeFilter === "" || card.type === typeFilter);

    // 種族フィルタ（部分一致、配列対応）
    let raceMatch = true;
    if (raceFilter !== "") {
      if (card.race) {
        if (Array.isArray(card.race)) {
          raceMatch = card.race.some(r => r.toLowerCase().includes(raceFilter));
        } else {
          raceMatch = card.race.toLowerCase().includes(raceFilter);
        }
      } else {
        raceMatch = false;
      }
    }

    // パワーフィルタ
    let powerValue = null;
    if (card.power !== undefined && card.power !== null && !isNaN(card.power)) {
      powerValue = Number(card.power);
    }

    let powerMatch = true;
    if (powerValue !== null) {
      if (minPower !== null) {
        powerMatch = powerMatch && (powerValue >= minPower);
      }
      if (maxPower !== null) {
        powerMatch = powerMatch && (powerValue <= maxPower);
      }
    } else {
      if (minPower !== null || maxPower !== null) {
        powerMatch = false;
      }
    }

    return nameMatch && civMatch && typeMatch && raceMatch && powerMatch;
  });

  displayCards(filtered);
}

// カードを画面に表示
function displayCards(cardList = cards) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  cardList.forEach(card => {
    let cost, civilization;

    if (card.type === "ツインパクト") {
      cost = card.parts.upper.cost;
      civilization = card.parts.upper.civilization.join("・");
    } else {
      cost = card.cost;
      civilization = Array.isArray(card.civilization) ? card.civilization.join("・") : card.civilization;
    }

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${card.image}" alt="${card.name}">
      <div class="card-info">
        <strong>${card.name}</strong><br>
        コスト: ${cost} / 文明: ${civilization}
      </div>
    `;
    div.onclick = () => addToDeck(card);
    container.appendChild(div);
  });
}

// デッキ画像グリッドの更新
function updateDeckImageGrid() {
  const grid = document.getElementById("deckImageGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const flatDeck = [];
  deck.forEach(card => {
    for (let i = 0; i < card.quantity && flatDeck.length < 40; i++) {
      flatDeck.push(card.image);
    }
  });

  flatDeck.forEach(imgPath => {
    const img = document.createElement("img");
    img.src = imgPath;
    grid.appendChild(img);
  });
}

// デッキ画像のダウンロード
function downloadDeckAsImage() {
  const canvas = document.getElementById("deckCanvas");
  if (!canvas) {
    alert("Canvas要素が見つかりません。");
    return;
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const flatDeck = [];
  deck.forEach(card => {
    for (let i = 0; i < card.quantity && flatDeck.length < 40; i++) {
      flatDeck.push(card.image);
    }
  });

  const cardWidth = 100;
  const cardHeight = 125;
  const cols = 8;

  let loadedCount = 0;
  flatDeck.forEach((src, index) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const x = (index % cols) * cardWidth;
      const y = Math.floor(index / cols) * cardHeight;
      ctx.drawImage(img, x, y, cardWidth, cardHeight);

      loadedCount++;
      if (loadedCount === flatDeck.length) {
        const link = document.createElement("a");
        link.download = "deck.png";
        link.href = canvas.toDataURL();
        link.click();
      }
    };
  });
}

// デッキにカードを追加
function addToDeck(card) {
  const totalCount = deck.reduce((sum, c) => sum + c.quantity, 0);
  if (totalCount >= 40) {
    alert("デッキに入れられるのは最大40枚までです！");
    return;
  }

  const existingCardIndex = deck.findIndex(item => item.id === card.id);
  if (existingCardIndex > -1) {
    if (deck[existingCardIndex].quantity >= 4) {
      alert(`${card.name} はデッキに4枚までしか入れられません！`);
      return;
    }
    deck[existingCardIndex].quantity += 1;
  } else {
    card = { ...card, quantity: 1 };
    deck.push(card);
  }

  updateDeckList();
}

// デッキ表示の更新
function updateDeckList() {
  const list = document.getElementById("deckList");
  const count = document.getElementById("deckCount");
  list.innerHTML = "";

  let total = 0;
  deck.forEach((card, index) => {
    total += card.quantity;
    const li = document.createElement("li");
    li.textContent = `${card.name} (${card.quantity})`;
    li.onclick = () => removeFromDeck(index);
    list.appendChild(li);
  });

  count.textContent = total;
  updateDeckImageGrid();
}

// デッキからカードを削除
function removeFromDeck(index) {
  const card = deck[index];
  if (card.quantity > 1) {
    card.quantity -= 1;
  } else {
    deck.splice(index, 1);
  }
  updateDeckList();
}

// デッキ保存
function saveDeck() {
  const deckName = document.getElementById("deckNameInput").value.trim();
  if (!deckName) {
    alert("デッキ名を入力してください。");
    return;
  }
  localStorage.setItem(`deck_${deckName}`, JSON.stringify(deck));
  alert(`デッキ「${deckName}」を保存しました！`);
  updateDeckListDropdown();
}

// セレクトボックスからデッキ読み込み
function loadSelectedDeck() {
  const deckName = document.getElementById("savedDecks").value;
  if (!deckName) return;
  const saved = localStorage.getItem(`deck_${deckName}`);
  if (saved) {
    deck = JSON.parse(saved);
    updateDeckList();
    alert(`デッキ「${deckName}」を読み込みました！`);
  }
}

// デッキ削除
function deleteSelectedDeck() {
  const deckName = document.getElementById("savedDecks").value;
  if (!deckName) {
    alert("削除するデッキを選択してください。");
    return;
  }
  if (confirm(`デッキ「${deckName}」を本当に削除しますか？`)) {
    localStorage.removeItem(`deck_${deckName}`);
    updateDeckListDropdown();
    alert(`デッキ「${deckName}」を削除しました。`);
  }
}

// セレクトボックスの更新
function updateDeckListDropdown() {
  const select = document.getElementById("savedDecks");
  select.innerHTML = '<option value="">保存されたデッキを選択</option>';

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("deck_")) {
      const name = key.replace("deck_", "");
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    }
  }
}

// デッキをすべて削除
function clearDeck() {
  if (confirm("本当にデッキを空にしますか？")) {
    deck = [];
    updateDeckList();
  }
}

// コスト順に並び替え
function sortDeckByCost() {
  deck.sort((a, b) => {
    const costA = a.type === "ツインパクト" ? a.parts.upper.cost : a.cost;
    const costB = b.type === "ツインパクト" ? b.parts.upper.cost : b.cost;
    return costA - costB;
  });
  updateDeckList();
}

// 名前順に並び替え
function sortDeckByName() {
  deck.sort((a, b) => a.name.localeCompare(b.name));
  updateDeckList();
}

// JSONエクスポート
function exportDeck() {
  const deckName = document.getElementById("savedDecks").value;
  if (!deckName) {
    alert("エクスポートするデッキを選択してください");
    return;
  }

  const saved = localStorage.getItem(`deck_${deckName}`);
  if (saved) {
    const blob = new Blob([saved], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${deckName}.json`;
    link.click();
  }
}

// 初期読み込み
window.onload = async function () {
  try {
    const response = await fetch("data/cards.json");
    cards = await response.json();
    displayCards();
    updateDeckListDropdown();
  } catch (error) {
    console.error("cards.json の読み込みに失敗しました:", error);
  }
};