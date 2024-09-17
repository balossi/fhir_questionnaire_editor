import React, { useContext, useState } from 'react';
import { TreeContext } from '../../store/treeStore/treeStore';
import FormBuilder from '../../views/FormBuilder';
import { useBalossiEdit } from '../library';
import '../../views/FrontPage.css';
import '../override.css';

const FrontPage = (): JSX.Element => {
  const { dispatch } = useContext(TreeContext);
  const [isFormBuilderShown, setIsFormBuilderShown] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [isDeletionAlertShown, setIsDeletionAlertShown] = useState<boolean>(false);

  const { isLoading, error } = useBalossiEdit({
    dispatch,
    setIsFormBuilderShown,
    setJsonData,
  });

  return (
    <div className="App">
      {error ? (
        <div className="errorHeader">
          <p>Error: {error}</p>
        </div>
      ) : isFormBuilderShown ? (
        <FormBuilder
          close={() => {
            setIsDeletionAlertShown(true);
          }}
        />
      ) : (
        <p>Loading JSON data...</p>
      )}
    </div>
  );
};

export default FrontPage;