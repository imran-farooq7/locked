export default function VerificationFilters() {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex flex-col gap-4 md:flex-row">
        <select className="border rounded-lg px-4 py-2">
          <option>All Types</option>
          <option>Text Proof</option>
          <option>Image Proof</option>
          <option>File Proof</option>
        </select>

        <select className="border rounded-lg px-4 py-2">
          <option>Newest First</option>
          <option>Oldest First</option>
          <option>Highest Penalty</option>
        </select>

        <input
          type="text"
          placeholder="Search by goal title or user..."
          className="flex-1 border rounded-lg px-4 py-2"
        />
      </div>
    </div>
  );
}
