// src/pages/Contact.js
import React, { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const response = await fetch("https://formspree.io/f/meogabva", {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      setStatus("SUCCESS");
      form.reset();
    } else {
      setStatus("ERROR");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-green-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <h2 className="text-2xl font-semibold mb-4 text-center text-blue-700">📬 Contact Us</h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          We'd love to hear from you! Please fill out the form below and we’ll get back to you soon.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            required
            className="border rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            className="border rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-300"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            required
            className="border rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-300"
          ></textarea>
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>

        {status === "SUCCESS" && (
          <p className="text-green-600 text-sm mt-4 text-center">
            ✅ Thank you! Your message has been sent.
          </p>
        )}
        {status === "ERROR" && (
          <p className="text-red-600 text-sm mt-4 text-center">
            ❌ Oops! Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
}
