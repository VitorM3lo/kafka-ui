import { Dropdown, DropdownItem } from 'components/common/Dropdown';
import IconButtonWrapper from 'components/common/Icons/IconButtonWrapper';
import MessageToggleIcon from 'components/common/Icons/MessageToggleIcon';
import { TopicMessage } from 'generated-sources';
import { formatTimestamp } from 'lib/dateTimeHelpers';
import { useSendMessage } from 'lib/hooks/api/topics';
import useAppParams from 'lib/hooks/useAppParams';
import useDataSaver from 'lib/hooks/useDataSaver';
import React from 'react';
import styled from 'styled-components';
import { RouteParamsClusterTopic } from 'lib/paths';

import MessageContent from './MessageContent/MessageContent';
import * as S from './MessageContent/MessageContent.styled';

const StyledDataCell = styled.td`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 350px;
  min-width: 350px;
`;

const ClickableRow = styled.tr`
  cursor: pointer;
`;

export interface Props {
  message: TopicMessage;
}

const Message: React.FC<Props> = ({
  message: {
    timestamp,
    timestampType,
    offset,
    key,
    partition,
    content,
    valueFormat,
    keyFormat,
    headers,
  },
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const savedMessageJson = {
    Content: content,
    Offset: offset,
    Key: key,
    Partition: partition,
    Headers: headers,
    Timestamp: timestamp,
  };
  const savedMessage = JSON.stringify(savedMessageJson, null, '\t');
  const { copyToClipboard, saveFile } = useDataSaver(
    'topic-message',
    savedMessage || ''
  );

  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();

  const sendMessage = useSendMessage({ clusterName, topicName });

  const submit = async (data: {
    key: string;
    content: string;
    headers: string;
    partition: number;
  }) => {
    const { partition, key, content } = data;
    JSON.parse(data.headers);
    const headers = data.headers ? JSON.parse(data.headers) : undefined;
    await sendMessage.mutateAsync({
      key: !key ? null : key,
      content: !content ? null : content,
      headers,
      partition: !partition ? 0 : partition,
    });
  };

  const replayMessage = () =>
    submit({
      key: key!,
      content: content!,
      headers: JSON.stringify(headers),
      partition,
    });

  const toggleIsOpen = () => setIsOpen(!isOpen);

  const [vEllipsisOpen, setVEllipsisOpen] = React.useState(false);

  return (
    <>
      <ClickableRow
        onMouseEnter={() => setVEllipsisOpen(true)}
        onMouseLeave={() => setVEllipsisOpen(false)}
        onClick={toggleIsOpen}
      >
        <td>
          <IconButtonWrapper aria-hidden>
            <MessageToggleIcon isOpen={isOpen} />
          </IconButtonWrapper>
        </td>
        <td>{offset}</td>
        <td>{partition}</td>
        <td>
          <div>{formatTimestamp(timestamp)}</div>
        </td>
        <StyledDataCell title={key}>{key}</StyledDataCell>
        <StyledDataCell>
          <S.Metadata>
            <S.MetadataValue>{content}</S.MetadataValue>
          </S.Metadata>
        </StyledDataCell>
        <td style={{ width: '5%' }}>
          {vEllipsisOpen && (
            <Dropdown>
              <DropdownItem onClick={copyToClipboard}>
                Copy to clipboard
              </DropdownItem>
              <DropdownItem onClick={saveFile}>Save as a file</DropdownItem>
              <DropdownItem onClick={replayMessage}>
                Replay message
              </DropdownItem>
            </Dropdown>
          )}
        </td>
      </ClickableRow>
      {isOpen && (
        <MessageContent
          messageKey={key}
          messageKeyFormat={keyFormat}
          messageContent={content}
          messageContentFormat={valueFormat}
          headers={headers}
          timestamp={timestamp}
          timestampType={timestampType}
        />
      )}
    </>
  );
};

export default Message;
