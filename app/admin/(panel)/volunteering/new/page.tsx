import ShiftForm from '../ShiftForm';
import { createShift } from '../actions';

export default function NewShiftPage() {
  return <ShiftForm title="فترة تطوّع جديدة" action={createShift} submitLabel="إضافة" />;
}
