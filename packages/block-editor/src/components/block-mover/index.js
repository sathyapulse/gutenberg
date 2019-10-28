/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getBlockType, __experimentalGetBlockLabel } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getBlockMoverDescription } from './mover-description';
import { upArrow, downArrow, dragHandle } from './icons';
import { IconDragHandle } from './drag-handle';

export class BlockMover extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus() {
		this.setState( {
			isFocused: true,
		} );
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render() {
		const {
			onMoveUp,
			onMoveDown,
			isFirst,
			isLast,
			isDraggable,
			onDragStart,
			onDragEnd,
			clientIds,
			blockElementId,
			firstIndex,
			isLocked,
			instanceId,
			isHidden,
			rootClientId,
			// `blockType` is now deprecated. If it's defined use it as the default
			// for its replacement, `blockLabel`.
			blockType,
			blockLabel = ( blockType ? blockType.title : undefined ),
		} = this.props;
		const { isFocused } = this.state;
		const blocksCount = castArray( clientIds ).length;
		if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
			return null;
		}

		if ( blockType ) {
			deprecated( 'wp.blockEditor.BlockMover blockType prop', {
				alternative: 'blockLabel prop',
			} );
		}

		// We emulate a disabled state because forcefully applying the `disabled`
		// attribute on the button while it has focus causes the screen to change
		// to an unfocused state (body as active element) without firing blur on,
		// the rendering parent, leaving it unable to react to focus out.
		return (
			<div className={ classnames( 'editor-block-mover block-editor-block-mover', { 'is-visible': isFocused || ! isHidden } ) }>
				<IconButton
					className="editor-block-mover__control block-editor-block-mover__control"
					onClick={ isFirst ? null : onMoveUp }
					icon={ upArrow }
					label={ __( 'Move up' ) }
					aria-describedby={ `block-editor-block-mover__up-description-${ instanceId }` }
					aria-disabled={ isFirst }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<IconDragHandle
					className="editor-block-mover__control block-editor-block-mover__control"
					icon={ dragHandle }
					clientId={ clientIds }
					blockElementId={ blockElementId }
					isVisible={ isDraggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				/>
				<IconButton
					className="editor-block-mover__control block-editor-block-mover__control"
					onClick={ isLast ? null : onMoveDown }
					icon={ downArrow }
					label={ __( 'Move down' ) }
					aria-describedby={ `block-editor-block-mover__down-description-${ instanceId }` }
					aria-disabled={ isLast }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<span id={ `block-editor-block-mover__up-description-${ instanceId }` } className="editor-block-mover__description block-editor-block-mover__description">
					{
						getBlockMoverDescription(
							blocksCount,
							blockLabel,
							firstIndex,
							isFirst,
							isLast,
							-1,
						)
					}
				</span>
				<span id={ `block-editor-block-mover__down-description-${ instanceId }` } className="editor-block-mover__description block-editor-block-mover__description">
					{
						getBlockMoverDescription(
							blocksCount,
							blockLabel,
							firstIndex,
							isFirst,
							isLast,
							1,
						)
					}
				</span>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlock,
			getBlockIndex,
			getTemplateLock,
			getBlockRootClientId,
			getBlockOrder,
			getBlockAttributes,
		} = select( 'core/block-editor' );

		const normalizedClientIds = castArray( clientIds );
		const firstClientId = first( normalizedClientIds );
		const block = getBlock( firstClientId );
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex( last( normalizedClientIds ), rootClientId );
		const blockType = getBlockType( block.name );
		const blockAttributes = getBlockAttributes( firstClientId );

		return {
			blockLabel: __experimentalGetBlockLabel( blockType, blockAttributes ),
			isLocked: getTemplateLock( rootClientId ) === 'all',
			rootClientId,
			firstIndex,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch( 'core/block-editor' );
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
		};
	} ),
	withInstanceId,
)( BlockMover );
