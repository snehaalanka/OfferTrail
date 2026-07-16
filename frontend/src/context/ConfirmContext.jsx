import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((msg) => {
    setMessage(msg);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-white rounded-xl shadow-lg border border-notion-border w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6">
              <h3 className="text-[17px] font-semibold text-notion-text-main mb-2">Please confirm</h3>
              <p className="text-[14px] text-notion-text-sub font-light">{message}</p>
            </div>
            <div className="bg-[#fafaf9] px-6 py-4 border-t border-notion-border flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-[13.5px] font-medium text-notion-text-main hover:bg-[#e9e9e6] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-[13.5px] font-medium text-white bg-[#415b33] hover:bg-[#2f4227] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
