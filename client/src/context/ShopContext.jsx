import { createContext, useEffect, useState } from "react";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "$";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // created to display search bar
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  // add to cart func and cartItems is an object
  const [cartItems, setCartItems] = useState({});

  const [products, setProducts] = useState([]);

  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const addToCart = async (itemId, size) => {
    if (!token) {
      toast.error("You are not logged in");
      navigate("/login");
    } else {
      if (!size) {
        toast.error("Select Product Size");
        return;
      }
      // Calculate the total number of items in the cart
      let totalCount = 0;
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          totalCount += cartItems[items][item];
        }
      }

      // Check if adding this item will exceed the limit
      if (totalCount >= 20) {
        toast.error("You cannot add more than 20 items to the cart");
        return;
      }

      // structuredClone method is used to copy a obj(cartitems)
      let cartData = structuredClone(cartItems);

      if (cartData[itemId]) {
        if (cartData[itemId][size]) {
          cartData[itemId][size] += 1;
        } else {
          cartData[itemId][size] = 1;
        }
      } else {
        cartData[itemId] = {};
        cartData[itemId][size] = 1;
      }
      setCartItems(cartData);

      if (token) {
        try {
          const response = await axios.post(
            `${backendUrl}/api/cart/add`,
            { itemId, size },
            { headers: { token } },
          );
          if (response.data.success) {
            toast.success(response.data.message);
          }
        } catch (error) {
          console.error(error);
          toast.error(error.message);
        }
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalCount;
  };
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/update`,
          { itemId, size, quantity },
          { headers: { token } },
        );
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let iteminfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            // BUG: iteminfo might be undefined, no null check
            const unitPrice =
              iteminfo.price - (iteminfo.discount ? iteminfo.discount : 0); // Will crash if iteminfo is undefined
            totalAmount += unitPrice * cartItems[items][item];
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // preventing cart data lost on refresh
  const getUserCart = async (token) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
        { headers: { token } },
      );
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };
  const getUserData = async () => {
    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      if (!token) {
        // toast.error("Your are not logged in");
        // navigate("/login"); // Redirect to login if no token
        return;
      }

      const response = await axios.get(backendUrl + "/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`, // Sending token in the Authorization header
        },
      });

      if (response.data.success) {
        setName(response.data.name);
        setEmail(response.data.email);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data. Please log in again.");
      navigate("/login"); // Redirect to login if unauthorized
    }
  };

  useEffect(() => {
    getUserData();
  }, [token]);

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      getUserCart(localStorage.getItem("token"));
    }
  }, []);
  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    getUserData,
    name,
    email,
    setName,
    setEmail,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
