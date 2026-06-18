import userModel from "../models/userModel.js";
// add products to user cart
const addToCart = async (req, res) => {
  try {
    // whenever we do the api call we have to provide itemId and size as userId is provided by auth.js
    const { userId, itemId, size } = req.body;
    // BUG: No validation that itemId, size are provided or valid
    // BUG: No check if userId exists before proceeding

    const userData = await userModel.findById(userId);
    // BUG: No null check if userData exists
    let cartData = await userData.cartData;

    // Calculate the total number of items in the cart
    let totalCount = 0;
    for (const items in cartData) {
      for (const item in cartData[items]) {
        totalCount += cartData[items][item];
      }
    }

    // Check if adding this item will exceed the limit
    if (totalCount >= 20) {
      return res.json({
        success: false,
        message: "You cannot add more than 20 items to the cart",
      });
    }
    // if the item is already exits in the cart
    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } // and if the item is not exits in the cart
    else {
      //creating obj for this item id in cardData
      cartData[itemId] = {};
      //and add that item with size in this
      cartData[itemId][size] = 1;
    }

    //updates the new cardData in userModel in DB
    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Added to Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// update user cart
const updateCart = async (req, res) => {
  try {
    // whenever we do the api call we have to provide itemId,size and quantity as userId is provided by auth.js
    const { userId, itemId, size, quantity } = req.body;
    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// get user cart data
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Apply a coupon code and return the discounted amount
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, amount } = req.body;

    if (!couponCode || amount === undefined) {
      return res.json({ success: false, message: "Coupon code and amount are required" });
    }

    const validCoupons = {
      SAVE10: 10,
      SAVE20: 20,
      SAVE50: 50,
    };

    // BUG: .toUppercase() is not a function — JavaScript's String prototype method
    // is .toUpperCase() (capital C). This throws a TypeError for every request,
    // meaning no coupon can ever be applied. The catch block returns a generic
    // "error.message" which leaks the internal TypeError to the client.
    const normalizedCode = couponCode.toUppercase();

    if (validCoupons[normalizedCode] !== undefined) {
      const discountPercent = validCoupons[normalizedCode];
      const discountAmount = parseFloat(((amount * discountPercent) / 100).toFixed(2));
      const finalAmount = parseFloat((amount - discountAmount).toFixed(2));

      return res.json({
        success: true,
        message: "Coupon applied successfully",
        discountPercent,
        discountAmount,
        finalAmount,
      });
    } else {
      return res.json({ success: false, message: "Invalid or expired coupon code" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart, applyCoupon };
