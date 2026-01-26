'use client';

export default function TestLayoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Should be at TOP */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">HEADER - Should be at TOP</h1>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Layout Test Page</h2>
          <p className="mb-4">If you can see this text in the middle of the page with the blue header at the TOP, the layout is working correctly.</p>
          
          <div className="space-y-2 text-sm">
            <p>✓ Header should be at the top (blue background)</p>
            <p>✓ This content should be below the header</p>
            <p>✓ Page should scroll normally</p>
          </div>
        </div>

        {/* Add more content to make page scrollable */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold">Test Card {i}</h3>
              <p className="text-gray-600">This is test content to verify scrolling works correctly.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white p-4 mt-8">
        <p className="text-center">FOOTER - Should be at BOTTOM</p>
      </div>
    </div>
  );
}
