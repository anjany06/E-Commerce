import express from "express"
import { addToCart, getUserCart, updateCart, applyCoupon } from "../controllers/cartController.js"
import authUser from "../middleware/auth.js";

const cardRouter = express.Router();

cardRouter.post( "/get", authUser, getUserCart);
cardRouter.post("/add" , authUser, addToCart)
cardRouter.post("/update", authUser, updateCart)
cardRouter.post("/coupon", authUser, applyCoupon)

export default cardRouter;