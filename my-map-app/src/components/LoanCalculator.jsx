import React, { useState } from "react";

export default function LoanCalculator() {
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [termYears, setTermYears] = useState("");
  const [schedule, setSchedule] = useState([]);

  const calculateAmortization = () => {
    const principal = parseFloat(amount);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numPayments = parseInt(termYears) * 12;

    if (isNaN(principal) || isNaN(monthlyRate) || isNaN(numPayments)) {
      alert("Please enter valid values for all fields.");
      return;
    }

    const monthlyPayment =
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));

    let balance = principal;
    const amortization = [];

    for (let i = 1; i <= numPayments; i++) {
      const interest = balance * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      balance -= principalPaid;

      amortization.push({
        month: i,
        payment: monthlyPayment,
        principalPaid,
        interestPaid: interest,
        remainingBalance: balance > 0 ? balance : 0,
      });
    }

    setSchedule(amortization);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-green-400 text-white p-6 text-center">
          <h2 className="text-3xl font-bold">
            🎓 Federal Student Aid Loan Calculator
          </h2>
          <p className="mt-2 text-sm">
            Estimate your monthly payments and explore your amortization schedule.
          </p>
        </div>

        <div className="p-6 bg-white md:flex md:gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💵 Loan Amount ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📉 Interest Rate (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. 4.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏳ Loan Term (Years)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={termYears}
                onChange={(e) => setTermYears(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. 10"
              />
            </div>

            <button
              onClick={calculateAmortization}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Calculate Payments
            </button>
          </div>
        </div>

        {schedule.length > 0 && (
          <div className="p-6 bg-blue-50 rounded-b-2xl mt-4">
            <h3 className="text-xl font-semibold text-center text-blue-700 mb-4">
              📊 Amortization Schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-center border border-gray-300 bg-white rounded-lg overflow-hidden">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">Month</th>
                    <th className="px-4 py-2 border">Payment</th>
                    <th className="px-4 py-2 border">Principal</th>
                    <th className="px-4 py-2 border">Interest</th>
                    <th className="px-4 py-2 border">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.month} className="border-t">
                      <td className="px-4 py-2">{item.month}</td>
                      <td className="px-4 py-2 text-green-700 font-medium">
                        ${item.payment.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">${item.principalPaid.toFixed(2)}</td>
                      <td className="px-4 py-2">${item.interestPaid.toFixed(2)}</td>
                      <td className="px-4 py-2">${item.remainingBalance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
