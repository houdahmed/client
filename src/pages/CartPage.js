import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/Auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // حساب السعر الإجمالي
  const totalPrice = () => {
    const total = cart?.reduce((acc, item) => acc + item.price, 0) || 0;
    return total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  // إزالة عنصر من الكارت
  const removeCartItem = (pid) => {
    const updatedCart = cart.filter((item) => item._id !== pid);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // الحصول على توكن الدفع
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.error("Braintree Token Error:", error);
    }
  };

  useEffect(() => {
    getToken();
  }, []);

  // تنفيذ الدفع
  const handlePayment = async () => {
    if (!instance) return;
    setLoading(true);
    try {
      const { nonce } = await instance.requestPaymentMethod();
      await axios.post("/api/v1/product/braintree/payment", { nonce, cart });
      setCart([]);
      localStorage.removeItem("cart");
      toast.success("Payment Completed Successfully");
      navigate("/dashboard/user/orders");
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Payment Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // فلترة العناصر المكررة حسب _id لتجنب التحذير
  const uniqueCart = Array.from(
    new Map(cart.map((item) => [item._id, item])).values()
  );

  return (
    <Layout>
      <div className="cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user ? "Hello Guest" : `Hello ${auth?.user?.name}`}
            </h1>
            <p className="text-center">
              {cart?.length
                ? `You have ${cart.length} item(s) in your cart ${
                    auth?.token ? "" : "please login to checkout!"
                  }`
                : "Your Cart Is Empty"}
            </p>
          </div>
        </div>

        <div className="container">
          <div className="row">
            {/* عرض الكارت */}
            <div className="col-md-7 p-0 m-0">
              {uniqueCart?.map((p) => (
                <div className="row card flex-row mb-2" key={p._id}>
                  <div className="col-md-4">
                    <img
                      src={`/api/v1/product/product-photo/${p._id}`}
                      alt={p.name}
                      className="card-img-top"
                      width="100%"
                      height="130px"
                    />
                  </div>
                  <div className="col-md-4">
                    <p>{p.name}</p>
                    <p>{p.description.substring(0, 30)}...</p>
                    <p>Price: {p.price}</p>
                  </div>
                  <div className="col-md-4 cart-remove-btn">
                    <button
                      className="btn btn-danger"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ملخص الكارت والدفع */}
            <div className="col-md-5 cart-summary">
              <h2>Cart Summary</h2>
              <hr />
              <h4>Total: {totalPrice()}</h4>

              {auth?.user?.address ? (
                <div className="mb-3">
                  <h4>Current Address</h4>
                  <h5>{auth.user.address}</h5>
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => navigate("/dashboard/user/profile")}
                  >
                    Update Address
                  </button>
                </div>
              ) : auth?.token ? (
                <button
                  className="btn btn-outline-warning"
                  onClick={() => navigate("/dashboard/user/profile")}
                >
                  Update Address
                </button>
              ) : (
                <button
                  className="btn btn-outline-warning"
                  onClick={() => navigate("/login", { state: "/cart" })}
                >
                  Please Login to checkout
                </button>
              )}

              {/* DropIn و زر الدفع */}
              {clientToken && uniqueCart?.length > 0 && (
                <div className="mt-2">
                  <DropIn
                    options={{
                      authorization: clientToken,
                      paypal: { flow: "vault" },
                    }}
                    onInstance={(inst) => setInstance(inst)}
                  />

                  <button
                    className="btn btn-primary"
                    onClick={handlePayment}
                    disabled={loading || !instance || !auth?.user?.address}
                  >
                    {loading ? "Processing..." : "Make Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
