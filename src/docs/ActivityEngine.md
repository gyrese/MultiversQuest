
# Activity Engine - Socle Commun

## Vue d'ensemble

L'Activity Engine fournit une architecture centralisée pour les mini-jeux de MultiversQuest. Il se compose de deux éléments principaux :
1. **ActivityShell** : Un composant React gérant l'interface, les animations et le flux de jeu.
2. **useActivityScore** : Un hook personnalisé pour gérer le chronomètre, les tentatives et le calcul du score.

## Utilisation Rapide

```jsx
import { ActivityShell } from '../components';
import { useActivityScore } from '../hooks/useActivityScore';

export default function MonMiniJeu() {
  // 1. Initialiser le hook de scoring
  const { 
    isPlaying, 
    isCompleted, 
    score, 
    stats,
    startActivity, 
    recordAction, 
    finalizeActivity 
  } = useActivityScore({
    maxPoints: 1000,
    activityType: 'standard', // ou 'sequence', 'quiz', 'decode'
    onComplete: (result) => console.log("Fin:", result)
  });

  // 2. Logique spécifique au jeu
  const handleGameAction = () => {
    // Si succès
    finalizeActivity(true);
    // Si erreur
    recordAction(true);
  };

  return (
    <ActivityShell
      title="Mon Super Jeu"
      universeName="Mon Univers"
      color="cyan"
      maxPoints={1000}
      instructions="Cliquez sur le bouton pour gagner."
      // Connecter l'état du hook au shell
      isPlaying={isPlaying}
      isCompleted={isCompleted}
      score={score}
      stats={stats}
      // Connecter les actions
      onStart={startActivity}
      onRetry={startActivity}
      onExit={() => console.log('Exit')}
      onNext={() => console.log('Next')}
    >
      {/* 3. Contenu du jeu (affiché uniquement pendant la phase de jeu) */}
      <div className="flex flex-col items-center justify-center h-full">
        <button onClick={handleGameAction}>Gagner !</button>
      </div>
    </ActivityShell>
  );
}
```

## Configuration

### ActivityShell Props
- `title` (string): Titre du jeu.
- `universeName` (string): Nom de l'univers.
- `color` (string): Thème ('cyan', 'gold', 'green', 'red').
- `instructions` (string): Texte d'aide.
- `maxPoints` (number): Score max affiché.
- `isPlaying`, `isCompleted`, `score`, `stats`: Props d'état à passer depuis le hook.
- `onStart`, `onRetry`, `onExit`, `onNext`: Callbacks d'actions.

### useActivityScore Options
- `maxPoints` (number): Base de points (défaut: 1000).
- `activityType` (string): 
  - `'standard'`: Pénalité simple par erreur.
  - `'sequence'`: Simon-like, pénalité exponentielle, bonus de vitesse.
  - `'quiz'`: Pénalité en pourcentage.
  - `'decode'`: Time trial, pénalité forte après seuil de temps.
- `onComplete` (function): Callback appelé à la fin du jeu avec le résultat.
