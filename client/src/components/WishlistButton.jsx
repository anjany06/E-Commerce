import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const WishlistButton = ({ productId }) => {
  const { wishlistItems, addToWishlist, removeFromWishlist, token, navigate } =
    useContext(ShopContext);

  const isWishlisted = wishlistItems.includes(productId);

  const handleWishlistClick = (e) => {
    // BUG: Typo - stopPropogation should be stopPropagation
    // This throws TypeError: e.stopPropogation is not a function at runtime
    e.stopPropogation();

    if (!token) {
      navigate("/login");
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  return (
    <button
      onClick={handleWishlistClick}
      className="absolute top-3 right-3 p-1.5 rounded-full bg-white shadow-md hover:scale-110 transition-transform"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isWishlisted ? "red" : "none"}
        stroke={isWishlisted ? "red" : "currentColor"}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
};

export default WishlistButton;
