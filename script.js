/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

let selectedProducts = [];
let messages = [
  {
    role: "system",
    content: "You are a L'Oréal product advisor. Only recommend or discuss L'Oréal products and brands under the L'Oréal portfolio. Never recommend competing brands. Use the user's selected products and preferences to build routines. Organize products in a logical order based on category. Relevant categories may include moisturizer and treatments, haircare, makeup, hair color, hair styling, men's grooming, suncare, and fragrance. If selected products belong to different categories, group them clearly instead of forcing them into one routine. Politely decline unrelated requests and steer the conversation back to L'Oréal beauty products.'"
  }
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

function updateSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p>No products selected yet.</p>`;
    return;
  }

  const names = selectedProducts.map((product) => product.name);
  selectedProductsList.innerHTML = `<p>${names.join(", ")}</p>`;
}


/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

    // Adding selection behavior after cards are loaded
  const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card, index) => {
    card.addEventListener("click", () => {
      const clickedProduct = products[index];
      const alreadySelected = selectedProducts.some(
        (p) => p.name === clickedProduct.name
      );

      if (alreadySelected) {
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== clickedProduct.name
        );
        card.classList.remove("selected");
      } else {
        selectedProducts.push(clickedProduct);
        card.classList.add("selected");
      }

      updateSelectedProducts();
    });
  });
}



/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

// function to send message to chatbot
async function sendMessagesToChatbot() {
  chatWindow.innerHTML = "Loading...";

  try {
    const response = await fetch("https://open-ai-worker.edgar-vazquezgonzalez.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    const assistantReply =
      data.choices?.[0]?.message?.content || "No response received.";

    messages.push({
      role: "assistant",
      content: assistantReply
    });

    chatWindow.innerHTML = assistantReply;
  } catch (error) {
    chatWindow.innerHTML = "Uh oh, something went wrong.";
    console.error(error);
  }
}

generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = "Please select at least one product first.";
    return;
  }

  const productNames = selectedProducts.map((product) => product.name).join(", ");

  messages.push({
    role: "user",
    content: `Create a skincare routine using these selected products: ${productNames}. Put them in a logical order such as cleanser, treatment, moisturizer, sunscreen, and explain briefly how to use each one.`
  });

  await sendMessagesToChatbot();
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInputField = document.getElementById("userInput");
  const userInput = userInputField.value.trim();

  if (!userInput) return;

  messages.push({
    role: "user",
    content: userInput
  });

  await sendMessagesToChatbot();
  userInputField.value = "";
});
