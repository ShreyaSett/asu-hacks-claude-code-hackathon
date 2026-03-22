type Props = {
  apodImageUrl: string | null;
};

export function SpaceChrome({ apodImageUrl }: Props) {
  return (
    <>
      {apodImageUrl && (
        <div
          className="apod-backdrop"
          style={{ backgroundImage: `url(${apodImageUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className="apod-scrim" aria-hidden="true" />
      <div className="space-starfield space-starfield-a" aria-hidden="true" />
      <div className="space-starfield space-starfield-b" aria-hidden="true" />
      <div className="space-planet space-planet-1" aria-hidden="true" />
      <div className="space-planet space-planet-2" aria-hidden="true" />
      <div className="space-planet space-planet-3" aria-hidden="true" />
    </>
  );
}
