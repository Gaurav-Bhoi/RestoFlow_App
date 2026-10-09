import React from 'react';
import Paneer from '../../../assets/illustrations/paneer.svg';
import Dal from '../../../assets/illustrations/dal.svg';
import Roti from '../../../assets/illustrations/roti.svg';
import Rice from '../../../assets/illustrations/rice.svg';
import Naan from '../../../assets/illustrations/naan.svg';
import Coke from '../../../assets/illustrations/coke.svg';
import type { DishId } from '../restaurant/types';

const illustrations = {
  paneer: Paneer,
  dal: Dal,
  roti: Roti,
  rice: Rice,
  naan: Naan,
  coke: Coke,
};
export function DishIllustration({ id }: { id: DishId }) {
  const Illustration = illustrations[id];
  return (
    <Illustration
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
