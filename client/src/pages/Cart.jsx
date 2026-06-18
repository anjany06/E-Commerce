import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import assets from "../assets/assets/frontend_assets/assets";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";
import axios from "axios";
const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate, backendUrl, token, getCartAmount, delivery_fee } =
    useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (couponApplied) {
      toast.info("A coupon is already applied");
      return;
    }
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/coupon`,
        { couponCode, amount: getCartAmount() },
        { headers: { token } }
      );
      if (response.data.success) {
        // BUG: discount is applied to the CartTotal display only via local state.
        // getCartAmount() in ShopContext is never updated, so PlaceOrder.jsx still
        // sends the full un-discounted amount to the server. Customers get the
        // discount visually but pay full price.
        setDiscount(response.data.discountAmount);
        setCouponApplied(true);
        toast.success(`Coupon applied! You save ${currency}${response.data.discountAmount.toFixed(2)}`);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply coupon");
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponCode("");
    setCouponApplied(false);
    toast.info("Coupon removed");
  };

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>
      {cartData.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-lg">
            Your cart is empty <br />
            (Shop now to Proceed Further )
          </p>
        </div>
      ) : (
        <>
          <div>
            {cartData.map((item, index) => {
              const productData = products.find(
                (product) => product._id === item._id,
              );
              // BUG: No null check - if productData is undefined, accessing productData.image will crash

              return (
                <div
                  key={index}
                  className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                >
                  <div className="flex items-start gap-6">
                    <img
                      className="w-16 sm:w-20"
                      src={productData.image[0]}
                      alt=""
                    />
                    <div>
                      <p className="text-xs sm:text-lg font-medium">
                        {productData.name}
                      </p>
                      <div className="flex items-center gap-5 mt-2">
                        <p>
                          {currency}
                          {productData.price}
                        </p>
                        <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={item.quantity}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > 20) {
                        e.target.value = 20;
                        toast.error(
                          "You cannot add more than 20 items to the cart",
                        );
                      } else if (value === "" || value === 0) {
                        null;
                      } else {
                        updateQuantity(item._id, item.size, value);
                      }
                    }}
                  />
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    src={assets.bin_icon}
                    className="w-4 mr-4 sm:w-5 cursor-pointer"
                    alt=""
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end my-20">
            <div className="w-full sm:w-[450px]">
              {/* Coupon Code Section */}
              <div className="border rounded p-4 mb-4">
                <p className="text-sm font-medium mb-3">HAVE A COUPON?</p>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                    <div>
                      <p className="text-sm text-green-700 font-medium">{couponCode.toUpperCase()} applied</p>
                      <p className="text-xs text-green-600">You save {currency}{discount.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="border flex-1 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={applyCoupon}
                      className="bg-black text-white px-4 py-2 text-sm"
                    >
                      APPLY
                    </button>
                  </div>
                )}
                {discount > 0 && (
                  <div className="mt-3 flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- {currency}{discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <CartTotal />
              <div className="w-full text-end ">
                <button
                  onClick={() => navigate("/place-order")}
                  className="bg-black text-white text-sm my-8 px-8 py-3"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
