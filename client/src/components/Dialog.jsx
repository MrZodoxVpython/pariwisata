import { useEffect, useRef } from 'react';

export default function Dialog({ open, onClose, className = '', labelledBy, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch (err) {
          dialog.setAttribute('open', '');
        }
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const onCancel = (event) => {
      event.preventDefault();
      onClose?.();
    };
    const onClick = (event) => {
      if (event.target === dialog) onClose?.();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onClick);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onClick);
    };
  }, [onClose]);

  return (
    <dialog ref={ref} className={className} aria-labelledby={labelledBy}>
      {open ? children : null}
    </dialog>
  );
}