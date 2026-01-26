        {/* Entry Form */}
        {!receipt && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto touch-scroll p-3 bg-slate-50 dark:bg-slate-900"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Keyboard Shortcuts Help Banner - Full Width */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 mb-3">
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Shortcuts:
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F1
                  </kbd>{" "}Khalid
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F2
                  </kbd>{" "}Yussuf
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F3
                  </kbd>{" "}Zakaria
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    Ctrl+↵
                  </kbd>{" "}Submit
                </span>
              </div>
            </div>

            {/* Barcode Scanner Mode - Full Width */}
            {barcodeScannerMode && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Barcode Scanner Mode Active
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Scan or type product ID and press Enter
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcodeScannerMode(false)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    Exit
                  </button>
                </div>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && barcodeInput.trim()) {
                      e.preventDefault();
                      const product = products.find(
                        (p) =>
                          p.product_id.toLowerCase() ===
                          barcodeInput.trim().toLowerCase(),
                      );
                      if (product) {
                        const existingLine = lineItems.find(
                          (li) => li.product_id === product.id,
                        );
                        if (existingLine) {
                          updateLine(existingLine.id, {
                            quantity: String(
                              parseInt(existingLine.quantity || "1") + 1,
                            ),
                          });
                        } else {
                          const emptyLine = lineItems.find(
                            (li) => li.product_id === "",
                          );
                          if (emptyLine) {
                            updateLine(emptyLine.id, {
                              product_id: product.id,
                              searchTerm: product.name,
                              quantity: "1",
                              showDropdown: false,
                            });
                          } else {
                            setLineItems((items) => [
                              ...items,
                              {
                                id: crypto.randomUUID(),
                                product_id: product.id,
                                quantity: "1",
                                discount_type: "none",
                                discount_value: "",
                                searchTerm: product.name,
                                showDropdown: false,
                              },
                            ]);
                          }
                        }
                        setBarcodeInput("");
                        const audio = new Audio(
                          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2RNgcZZ7rq6KFXDQtPpuPvt2YdBjeP1vPOey0GI3bG8d+SOQgYaLrr6qRYDgtPpuPvt2YdBjiP1vPOey0GI3bG8d+SOQgYaLrr6qRYDgtPpuPvt2YdBjiP1vPOey0GI3bG8d+SOQgYaLrr6qRYDg==",
                        );
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                      } else {
                        alert(
                          `❌ Product with ID "${barcodeInput}" not found!`,
                        );
                        setBarcodeInput("");
                      }
                    }
                  }}
                  placeholder="Scan or type product ID here..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-purple-300 dark:border-purple-600 rounded-xl text-slate-800 dark:text-white text-lg font-mono focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600"
                />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
              {/* LEFT COLUMN - Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Products</span>
                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                      {lineItems.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {/* Product line items rendering - Keep existing code */}
                  {lineItems.map((li, idx) => {
                    // ... existing line item rendering code ...
                    // Keep all the existing product search, quantity, discount UI
                    // This is too long to repeat, so keep the existing implementation
                  })}
                </div>

                {/* Add Line Button */}
                <button
                  type="button"
                  onClick={addLine}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product Line</span>
                </button>
              </div>
              {/* End LEFT COLUMN */}

              {/* RIGHT COLUMN - Quick Sale, Sale Info, Discount, Summary, Actions */}
              <div className="space-y-3">
                {/* Quick Sale Mode Toggle */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Quick Sale Mode
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Skip payment selection for faster checkout
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSaleMode(!quickSaleMode);
                      if (!quickSaleMode) {
                        setSoldBy("Khalid");
                        setPaymentMethod("Till Number");
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation active:scale-95 ${
                      quickSaleMode ? "bg-green-600" : "bg-gray-600"
                    }`}
                    style={{ WebkitTapHighlightColor: "rgba(34,197,94,0.3)" }}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        quickSaleMode ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Quick Mode Info Banner (when active) */}
                {quickSaleMode && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-4 flex items-center space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        Quick Sale Active
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Till Number • Khalid
                      </p>
                    </div>
                  </div>
                )}

                {/* Sale Information - Only show when NOT in quick sale mode */}
                {!quickSaleMode && (
                  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-600 shadow-lg">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-600">
                      <span className="text-lg">📋</span>
                      <span>Sale Information</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Sold By (Staff) *
                        </label>
                        <select
                          required
                          value={soldBy}
                          onChange={(e) => setSoldBy(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                        >
                          <option
                            value=""
                            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          >
                            -- Select Staff Member --
                          </option>
                          {staffMembers.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                        >
                          {paymentMethods.map((m) => (
                            <option
                              key={m}
                              value={m}
                              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            >
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Customer Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                          placeholder="Walk-in Customer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Payment Status *
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={(e) =>
                            setPaymentStatus(
                              e.target.value as "paid" | "not_paid" | "partial",
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                        >
                          <option value="paid">Paid</option>
                          <option value="partial">Partial Payment</option>
                          <option value="not_paid">Not Paid</option>
                        </select>
                      </div>

                      {paymentStatus === "partial" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Amount Paid *
                          </label>
                          <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                            placeholder="Enter amount paid"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Overall Discount Section */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-600 shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-600">
                    <span className="text-lg">🏷️</span>
                    <span>Discount</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Discount Type
                      </label>
                      <select
                        value={overallDiscountType}
                        onChange={(e) => {
                          setOverallDiscountType(
                            e.target.value as DiscountType,
                          );
                          setOverallDiscountValue("");
                        }}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                      >
                        <option
                          value="none"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          No Overall Discount
                        </option>
                        <option
                          value="percentage"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          Percentage (%)
                        </option>
                        <option
                          value="amount"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          Fixed Amount (KES)
                        </option>
                      </select>
                    </div>
                    {overallDiscountType !== "none" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          value={overallDiscountValue}
                          onChange={(e) =>
                            setOverallDiscountValue(e.target.value)
                          }
                          min="0"
                          max={
                            overallDiscountType === "percentage"
                              ? 100
                              : undefined
                          }
                          step={
                            overallDiscountType === "percentage" ? "0.01" : "1"
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                          placeholder={
                            overallDiscountType === "percentage"
                              ? "e.g., 10 for 10%"
                              : "e.g., 500 for KES 500"
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-5 border-2 border-emerald-200 dark:border-emerald-700 shadow-lg">
                  <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center space-x-2 pb-3 border-b border-emerald-200 dark:border-emerald-700">
                    <span className="text-lg">💰</span>
                    <span>Summary</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Subtotal
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        KES {subtotal.toLocaleString()}
                      </span>
                    </div>
                    {total_line_discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Line Discounts
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          -KES {total_line_discount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {overallDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Overall Discount
                          {overallDiscountType === "percentage" &&
                            ` (${overallDiscountValue}%)`}
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          -KES {overallDiscountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t-2 border-emerald-300 dark:border-emerald-600 pt-4 mt-2">
                      <span className="text-emerald-800 dark:text-emerald-200">
                        Total Amount
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300">
                        KES {total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-emerald-100 dark:border-emerald-900">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Estimated Profit
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        KES {total_profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDrafts(!showDrafts)}
                      className="flex-1 min-w-[120px] px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Drafts ({savedDrafts.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="flex-1 min-w-[120px] px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      <span>Save Draft</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-5 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          <span>Complete Sale</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {/* End RIGHT COLUMN */}
            </div>
            {/* End Two Column Layout */}
          </form>
        )