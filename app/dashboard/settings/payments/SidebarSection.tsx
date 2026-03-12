export const SidebarSection = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-6">
      <Icon className="w-5 h-5" />
      <h3 className="font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);
