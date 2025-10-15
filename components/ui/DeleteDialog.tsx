"use client";

import { Fragment } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type DeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  entityName: string;
  entityType?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  isLoading?: boolean;
};

export function DeleteDialog({ open, onClose, onConfirm, entityName, entityType, titleOverride, descriptionOverride, isLoading }: DeleteDialogProps) {
  const normalizedTypeBase = (entityType ?? "item").trim();
  const normalizedType = normalizedTypeBase.charAt(0).toUpperCase() + normalizedTypeBase.slice(1);
  const title = titleOverride ?? `Delete ${normalizedType}`;
  const description = descriptionOverride ?? `Are you sure you want to delete ${entityName}? This action is permanent and cannot be undone.`;
  const handleConfirm = async () => { await onConfirm(); };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 
                   data-enter:duration-300 data-enter:ease-out 
                   data-leave:duration-200 data-leave:ease-in 
                   dark:bg-gray-900/50"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all 
                       data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                       data-leave:duration-200 data-leave:ease-in 
                       sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95 
                       dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
                  <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    {title}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-900">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!!isLoading}
                aria-disabled={!!isLoading}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm
                           hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600
                           sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {isLoading ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm
                           ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
                           sm:mt-0 sm:w-auto dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}