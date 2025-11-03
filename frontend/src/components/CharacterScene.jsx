import VisualEffects from './VisualEffects';

const CharacterScene = ({ hasEmail, hasPassword }) => {
  return (
    <div className="w-full h-full">
      <VisualEffects hasEmail={hasEmail} hasPassword={hasPassword} />
    </div>
  );
};

export default CharacterScene;

