-- Add MIXTA option to league type enum
ALTER TABLE `League`
  MODIFY `tipo` ENUM('VARONIL', 'FEMENIL', 'INFANTIL', 'MIXTA') NOT NULL;
