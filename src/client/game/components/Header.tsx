interface HeaderProps {
  dayNumber: number;
  streak: number;
}

export function Header({ dayNumber, streak }: HeaderProps) {
  return (
    <header className="game-header">
      <div className="header-left">
        <span className="logo">🔷</span>
        <span className="title">ShapeSwifter</span>
      </div>
      <div className="header-center">
        <span className="day-number">Day #{dayNumber}</span>
      </div>
      <div className="header-right">
        <span className="streak" title="Current streak">
          🔥 {streak}
        </span>
      </div>
    </header>
  );
}

export default Header;
