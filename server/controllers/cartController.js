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

export { addToCart, updateCart, getUserCart };
