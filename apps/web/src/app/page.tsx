export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-3xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white tracking-tight">
              Psycho Booster
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
              Admin Panel
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Submit Card */}
            <button className="group relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-8 hover:border-[#4169E1] dark:hover:border-[#4169E1] transition-all duration-200 text-left">
              <div className="space-y-4">
                <div className="w-10 h-10 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center group-hover:border-[#4169E1] dark:group-hover:border-[#4169E1] transition-colors">
                  <svg className="w-5 h-5 text-black dark:text-gray-300 group-hover:text-[#4169E1] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Submit</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Add questions to the database
                  </p>
                </div>
              </div>
            </button>

            {/* Viewer Card */}
            <button className="group relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-8 hover:border-[#4169E1] dark:hover:border-[#4169E1] active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-900 transition-all duration-200 text-left touch-manipulation">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-black dark:bg-black rounded flex items-center justify-center group-hover:bg-[#4169E1] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Viewer</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    View stored questions
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
