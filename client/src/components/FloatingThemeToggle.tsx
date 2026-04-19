import ThemeToggleButton from "@/components/ThemeToggleButton";

type FloatingThemeToggleProps = {
  className?: string;
};

export default function FloatingThemeToggle({
  className = "",
}: FloatingThemeToggleProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-full bg-card/90 p-1.5 shadow-xl backdrop-blur-xl ${className}`}
    >
      <ThemeToggleButton compact floating />
    </div>
  );
}
