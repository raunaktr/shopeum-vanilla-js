// const contentful = require("contentful");

// Variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart
let cart = [];
// buttons
let buttonsDOM = [];
/**
 * Contentful - CMS
 * using directly in the browser
 * @type first request was made here
 */
const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "6pr9c6vpq1j4",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "A3C4LkNTZVDUMxabZhoiiZPuNn_z3qpfIXUT0LKL0uA",
});
// getting the products
class Products {
    async getProducts() {
        try {
            let contentful = await client.getEntries({
                content_type: "shopeumProducts",
            });

            /**
             *
             * this was earlier used for fetching JSON locally
             let result = await fetch("./products.json");
             let data = await result.json();
             let products = data.items;
             *
             */

            let products = contentful.items;
            products = products.map((item) => {
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image };
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

// UI products
class UI {
    displayProducts(products) {
        let result = "";
        products.forEach((product) => {
            result += `
            <!-- Single Product starts -->
                <article class="product">
                    <div class="img-container">
                        <img
                            src=${product.image}
                            alt="product"
                            class="product-img"
                        />
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart">Add to Cart</i>
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>₹ ${product.price}</h4>
                </article>
                <!-- end of Single Product -->
            `;
        });
        productsDOM.innerHTML = result;
    }

    // getBagButton
    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach((button) => {
            let id = button.dataset.id;
            let inCart = cart.find((item) => item.id !== id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", (event) => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;

                // get product from products
                let cartItem = { ...Storage.getProduct(id), amount: 1 };
                // add product from products
                cart = [...cart, cartItem];
                // save cart in local storage
                Storage.saveCart(cart);
                // set cart values
                this.setCartValues(cart);
                // display cart item
                this.addCartItem(cartItem);
                // show cart
                this.showCart();
            });
        });
    }
    /**
     * @type setCartValues
     * @params cart
     * this function is responsible for adding temporary total, and
     * amount of an item in cart
     */
    setCartValues(cart) {
        let tmpTotal = 0;
        let itemsTotal = 0;
        cart.map((item) => {
            tmpTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        cartTotal.innerText = parseFloat(tmpTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    /**
     * @type addCartItem
     * @params item
     * this method is responsible for showing innerHTML
     * when an item is added to cart
     */
    addCartItem(item) {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
        <img src="${item.image}" alt="product" />
        <div class="">
            <h4>${item.title}</h4>
            <h5>₹${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount"data-id=${item.amount}>${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
        `;
        cartContent.append(div);
    }
    /**
     * @type [showCart]
     * @params none
     */
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }
    /**
     * @type [hideCart]
     * @params none
     */
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }

    /**
     * @type setupAPP
     * will check local storage for items already in cart
     * @if item is already present in cart, @type [populateCart] will be called
     * @else zero value will be displayed
     */
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }
    /**
     * @type populateCart
     * @params cart
     * will check local storage for items already in cart
     */
    populateCart(cart) {
        cart.forEach((item) => this.addCartItem(item));
    }

    /**
     * @type cartLogic
     * this method has primarily two functionalities
     * - clear cart button which is linked to a click event
     * - cartContent which listen to a click event
     *      - on clicking "remove" button, parent-to-parent element is removed
     *      - on clicking "fa-chevron-up", item is incremented in cart, amount is incremented and in localStorage
     *      - on clicking "fa-chevron-down", item is lowered in cart, amount is lowered and in localStorage

     */
    cartLogic() {
        // clear cart button
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });
        // cart functinality
        cartContent.addEventListener("click", (event) => {
            if (event.target.classList.contains("remove-item")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            } else if (event.target.classList.contains("fa-chevron-up")) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tmpItem = cart.find((item) => item.id === id);
                tmpItem.amount += 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);

                addAmount.nextElementSibling.innerText = tmpItem.amount;
            } else if (event.target.classList.contains("fa-chevron-down")) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tmpItem = cart.find((item) => item.id === id);
                tmpItem.amount -= 1;
                if (tmpItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText =
                        tmpItem.amount;
                } else {
                    cartContent.removeChild(
                        lowerAmount.parentElement.parentElement
                    );
                    this.removeItem(id);
                }
            }
        });
    }
    /**
     * @type clearCart
     * will check for id's of item
     * will remove only item's present in the cart
     * remove all content's of a cart until the cart is empty
     * will reset the total to zero
     */
    clearCart() {
        let cartItems = cart.map((item) => item.id);
        cartItems.forEach((id) => this.removeItem(id));
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    /**
     * @type removeItem
     * @params id
     * will filter out item's which are not present in cart
     * will remove that item from the local storage
     * will change the button to 'add to cart' from 'in cart'
     */

    removeItem(id) {
        cart = cart.filter((item) => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `
        <i class="fas fa-shopping-cart">Add to Cart</i>
        `;
    }
    /**
     * @type getSingleButton
     * @params id
     * will return a unique button associated with an id
     */
    getSingleButton(id) {
        return buttonsDOM.find((button) => button.dataset.id === id);
    }
}

// Local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find((product) => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem("cart")
            ? JSON.parse(localStorage.getItem("cart"))
            : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    // setup Application
    ui.setupAPP();

    // get all products
    products
        .getProducts()
        .then((products) => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(() => {
            ui.getBagButtons();
            ui.cartLogic();
        });
});
