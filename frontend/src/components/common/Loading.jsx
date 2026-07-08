const Loading = ({ message = 'Đang tải...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
    <div className="w-9 h-9 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
    <p className="text-sm text-neutral-500 font-medium">{message}</p>
  </div>
);

export default Loading;
