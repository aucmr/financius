type CategoryOption = {
  id: string;
  name: string;
};

type CategorySelectProps = {
  id: string;
  name: string;
  label: string;
  options: CategoryOption[];
};

export function CategorySelect({ id, name, label, options }: CategorySelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        name={name}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
