

import React from "react";

export default function TransitSavingsInfo() {
  return (
    <div className="mt-6 p-5 bg-purple-50 border border-purple-200 rounded-xl text-gray-800 text-sm leading-relaxed">
      <h4 className="text-lg font-semibold mb-2 text-purple-700">💸 How Students Can Save with Transit</h4>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Use free or discounted student passes:</strong> Many universities partner with local transit agencies to provide students with low-cost or free access to buses, subways, and light rail.
        </li>
        <li>
          <strong>Reduce car-related costs:</strong> Save hundreds or even thousands of dollars by avoiding parking fees, gas, insurance, and maintenance.
        </li>
        <li>
          <strong>Commute safely and affordably:</strong> Public transit is a safer and more economical alternative to rideshare apps or personal vehicles, especially in urban areas.
        </li>
        <li>
          <strong>Explore city discounts:</strong> Some cities offer extra student discounts or integrate transit passes with student IDs for convenience.
        </li>
        <li>
          <strong>Use multi-modal options:</strong> Combine bike-share or scooters with transit to reach off-campus housing or internship sites affordably.
        </li>
      </ul>
    </div>
  );
}
