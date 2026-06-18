import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { toast } from "react-toastify";

const Wishlist = () => {
  const { products, wishlistItems, removeFromWishlist, addToCart, currency, navigate } =
    useContext(ShopContext);

  // BUG: wishlistItems is an array of product ID strings, but .includes() is called
  // with the full product object — deep equality doesn't work for objects in .includes(),
  // so this filter always returns an empty array. The wishlist page never shows any items.
  const wishlistData = products.filter((product) =>
    wishlistItems.includes(product)
  );

  const handleMoveToCart = (productId) => {
    // BUG: addToCart requires a size as second argument, but it's not passed.
    // The user will always see "Select Product Size" toast with no way to proceed.
    addToCart(productId);
    removeFromWishlist(productId);
    toast.success("Moved to cart!");
  };

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"MY"} text2={"WISHLIST"} />
      </div>

      {wishlistData.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-gray-500 text-lg">Your wishlist is empty</p>
          <button
            onClick={() => navigate("/collection")}
            className="bg-black text-white px-8 py-3 text-sm"
          >
            BROWSE COLLECTION
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {wishlistData.map((product, index) => (
            <div
              key={index}
              className="border rounded-md overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={product.image[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${product._id}`)}
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {currency}
                  {product.price}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleMoveToCart(product._id)}
                    className="flex-1 bg-black text-white text-xs py-2 hover:bg-gray-800 transition-colors"
                  >
                    MOVE TO CART
                  </button>
                  <button
                    onClick={() => {
                      removeFromWishlist(product._id);
                      toast.info("Removed from wishlist");
                    }}
                    className="px-3 py-2 border border-gray-300 text-xs hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
