import React, { useState } from 'react';
import savedPacksJson from '../json/saved_packs.json';

interface SavedPack {
  pack: string;
  cards: string[];
  average_desirability: number;
  godpack: boolean;
  opened_timestamp: number;
  user: string;
  pwd: string;
  last_shared_timestamp: number;
}

interface SavedPacksData {
  [key: string]: SavedPack;
}

// Placeholder card image URLs
const placeholderImages = [
  "https://assets.pokemon-zone.com/game-assets/CardPreviews/cPK_10_000010_00_FUSHIGIDANE_C.webp",
  "https://assets.pokemon-zone.com/game-assets/CardPreviews/cPK_10_000020_00_FUSHIGISOU_U.webp",
  "https://assets.pokemon-zone.com/game-assets/CardPreviews/cPK_10_000030_00_FUSHIGIBANA_R.webp",
  "https://assets.pokemon-zone.com/game-assets/CardPreviews/cPK_10_000040_00_FUSHIGIBANAex_RR.webp",
  "https://assets.pokemon-zone.com/game-assets/CardPreviews/cPK_10_000050_00_CATERPIE_C.webp"
];

const PackSharing: React.FC = () => {
  const [savedPacks, setSavedPacks] = useState<SavedPacksData>(savedPacksJson as SavedPacksData);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string>('');
  const [summary, setSummary] = useState<string>('');

  const sharePack = async (packId: string) => {
    setIsSharing(true);
    setShareStatus(`Sharing pack...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSavedPacks(prev => ({
      ...prev,
      [packId]: {
        ...prev[packId],
        last_shared_timestamp: Math.floor(Date.now() / 1000)
      }
    }));
    setShareStatus(`Successfully shared pack!`);
    setSummary('');
    setIsSharing(false);
  };

  const shareAllPacks = async () => {
    setIsSharing(true);
    setShareStatus('Sharing all packs...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const now = Math.floor(Date.now() / 1000);
    const updated = Object.entries(savedPacks).reduce((acc, [packId, pack]) => ({
      ...acc,
      [packId]: { ...pack, last_shared_timestamp: now }
    }), {} as SavedPacksData);
    setSavedPacks(updated);
    setShareStatus('Successfully shared all packs');
    setSummary(`Shared ${Object.keys(savedPacks).length} packs.`);
    setIsSharing(false);
  };

  const packsArray = Object.entries(savedPacks);

  return (
    <div className="pack-sharing-container">
      <h2>Pack Sharing</h2>
      {shareStatus && <div className="share-status">{shareStatus}</div>}
      {summary && <div className="share-status">{summary}</div>}
      <div className="pack-list">
        {packsArray.length > 0 ? (
          <>
            <button 
              className="share-all-button"
              onClick={shareAllPacks}
              disabled={isSharing}
            >
              Share All Packs
            </button>
            {packsArray.map(([packId, pack], idx) => (
              <div key={packId} className="pack-item pack-panel">
                <div className="pack-info">
                  <h3>{pack.pack}</h3>
                  <div className="pack-cards-grid">
                    {pack.cards.map((card, i) => (
                      <img
                        key={i}
                        className="pack-card-img"
                        src={placeholderImages[i % placeholderImages.length]}
                        alt={card}
                        title={card}
                      />
                    ))}
                  </div>
                  {pack.last_shared_timestamp && (
                    <p className="last-shared">Last shared: {new Date(pack.last_shared_timestamp * 1000).toLocaleString()}</p>
                  )}
                </div>
                <button
                  className="share-button"
                  onClick={() => sharePack(packId)}
                  disabled={isSharing}
                >
                  Share Pack
                </button>
              </div>
            ))}
          </>
        ) : (
          <p>No saved packs found.</p>
        )}
      </div>
    </div>
  );
};

export default PackSharing; 