module.exports = {
  async up({ context: q }) {
    // Earlier releases only issued on local chain. Preserve those facts, never reissue.
    await q.sequelize.query(
      `UPDATE records SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"intendedChainId":31337}'::jsonb WHERE NOT (COALESCE(metadata,'{}'::jsonb) ? 'intendedChainId') AND NOT (COALESCE(metadata,'{}'::jsonb) ? 'chainId')`,
    );
    await q.sequelize.query(
      `UPDATE records SET metadata = metadata || '{"chainId":31337,"chainVersion":3}'::jsonb WHERE metadata ? 'chainContract' AND NOT (metadata ? 'chainId')`,
    );
  },
  async down() {
    /* Network provenance must not be discarded on downgrade. */
  },
};
