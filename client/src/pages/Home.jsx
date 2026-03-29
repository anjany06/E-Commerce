import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Loading from "../components/Loading";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  const { products } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (products.length > 0) {
      setLoading(false);
    }
    // BUG: Loading state never resets to true, if products become empty later it stays false
  }, [products]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;
